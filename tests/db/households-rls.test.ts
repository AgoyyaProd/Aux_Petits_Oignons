import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createUser, expectPgError, PG, pool, type TestUser } from "./helpers";

let alice: TestUser;
let bob: TestUser;

beforeAll(async () => {
  alice = await createUser("alice");
  bob = await createUser("bob");
});

describe("inscription", () => {
  it("crée profil, foyer par défaut et adhésion propriétaire", async () => {
    const { rows } = await pool.query(
      `select p.display_name, h.name, h.people_count, m.role
       from public.profiles p
       join public.households h on h.id = p.active_household_id
       join public.household_members m on m.household_id = h.id and m.user_id = p.id
       where p.id = $1`,
      [alice.id],
    );
    expect(rows).toEqual([
      { display_name: "alice", name: "Mon foyer", people_count: 2, role: "owner" },
    ]);
  });
});

describe("isolement entre foyers (A ne voit rien de B)", () => {
  it("A ne lit que son propre foyer", async () => {
    const ids = await asUser(alice, async (db) =>
      (await db.query<{ id: string }>("select id from public.households")).rows.map((r) => r.id),
    );
    expect(ids).toEqual([alice.householdId]);
  });

  it("A ne lit ni les membres ni le profil de B", async () => {
    const result = await asUser(alice, async (db) => ({
      members: (
        await db.query("select * from public.household_members where household_id = $1", [
          bob.householdId,
        ])
      ).rowCount,
      profile: (await db.query("select * from public.profiles where id = $1", [bob.id])).rowCount,
    }));
    expect(result).toEqual({ members: 0, profile: 0 });
  });

  it("A ne peut pas modifier le foyer de B (0 ligne touchée)", async () => {
    const updated = await asUser(
      alice,
      async (db) =>
        (
          await db.query("update public.households set name = 'piraté' where id = $1", [
            bob.householdId,
          ])
        ).rowCount,
    );
    expect(updated).toBe(0);
    const { rows } = await pool.query("select name from public.households where id = $1", [
      bob.householdId,
    ]);
    expect(rows[0].name).toBe("Mon foyer");
  });

  it("A ne peut pas pointer son profil vers le foyer de B", async () => {
    const code = await expectPgError(
      asUser(alice, (db) =>
        db.query("update public.profiles set active_household_id = $1 where id = $2", [
          bob.householdId,
          alice.id,
        ]),
      ),
    );
    expect(code).toBe(PG.insufficientPrivilege);
  });

  it("A ne peut pas retirer B de son foyer", async () => {
    const deleted = await asUser(
      alice,
      async (db) =>
        (await db.query("delete from public.household_members where user_id = $1", [bob.id]))
          .rowCount,
    );
    expect(deleted).toBe(0);
  });
});

describe("droits d'écriture sur son propre foyer", () => {
  it("le propriétaire modifie les champs autorisés", async () => {
    const row = await asUser(
      alice,
      async (db) =>
        (
          await db.query(
            "update public.households set name = 'Maison', people_count = 3 where id = $1 returning name, people_count",
            [alice.householdId],
          )
        ).rows[0],
    );
    expect(row).toEqual({ name: "Maison", people_count: 3 });
  });

  it("created_by n'est pas modifiable (privilège de colonne)", async () => {
    const code = await expectPgError(
      asUser(alice, (db) =>
        db.query("update public.households set created_by = $1 where id = $2", [
          bob.id,
          alice.householdId,
        ]),
      ),
    );
    expect(code).toBe(PG.insufficientPrivilege);
  });

  it("aucune création de foyer directe côté client", async () => {
    const code = await expectPgError(
      asUser(alice, (db) => db.query("insert into public.households (name) values ('x')")),
    );
    expect(code).toBe(PG.insufficientPrivilege);
  });

  it("les contraintes refusent une taille de foyer hors limites", async () => {
    const code = await expectPgError(
      asUser(alice, (db) =>
        db.query("update public.households set people_count = 0 where id = $1", [
          alice.householdId,
        ]),
      ),
    );
    expect(code).toBe("23514"); // check_violation
  });
});

describe("invitations", () => {
  it("parcours complet : invitation, acceptation, accès, départ", async () => {
    const carol = await createUser("carol");

    const token = await asUser(
      alice,
      async (db) =>
        (
          await db.query<{ token: string }>(
            "select public.create_household_invitation($1, $2) as token",
            [alice.householdId, carol.email],
          )
        ).rows[0]!.token,
      { commit: true },
    );
    expect(token).toMatch(/^[0-9a-f]{64}$/);

    // Le jeton clair n'est jamais stocké.
    const stored = await pool.query(
      "select token_hash from public.household_invitations where token_hash = $1",
      [token],
    );
    expect(stored.rowCount).toBe(0);

    // Bob (mauvaise adresse) ne peut pas l'utiliser.
    const bobCode = await expectPgError(
      asUser(bob, (db) => db.query("select public.accept_household_invitation($1)", [token])),
    );
    expect(bobCode).toBe(PG.invalidParameter);

    // Carol l'accepte et voit désormais le foyer d'Alice.
    await asUser(
      carol,
      (db) => db.query("select public.accept_household_invitation($1)", [token]),
      {
        commit: true,
      },
    );
    const visible = await asUser(carol, async (db) =>
      (await db.query<{ id: string }>("select id from public.households order by id")).rows
        .map((r) => r.id)
        .sort(),
    );
    expect(visible).toEqual([alice.householdId, carol.householdId].sort());

    // Usage unique.
    const reuse = await expectPgError(
      asUser(carol, (db) => db.query("select public.accept_household_invitation($1)", [token])),
    );
    expect(reuse).toBe(PG.invalidParameter);

    // Un simple membre ne peut pas inviter.
    const inviteCode = await expectPgError(
      asUser(carol, (db) =>
        db.query("select public.create_household_invitation($1, 'x@test.local')", [
          alice.householdId,
        ]),
      ),
    );
    expect(inviteCode).toBe(PG.insufficientPrivilege);

    // Un simple membre peut partir ; le propriétaire ne peut pas se retirer lui-même.
    const ownerLeaves = await asUser(
      alice,
      async (db) =>
        (
          await db.query(
            "delete from public.household_members where household_id = $1 and user_id = $2",
            [alice.householdId, alice.id],
          )
        ).rowCount,
    );
    expect(ownerLeaves).toBe(0);

    const carolLeaves = await asUser(
      carol,
      async (db) =>
        (
          await db.query(
            "delete from public.household_members where household_id = $1 and user_id = $2",
            [alice.householdId, carol.id],
          )
        ).rowCount,
    );
    expect(carolLeaves).toBe(1);
  });

  it("une invitation expirée est refusée", async () => {
    const dave = await createUser("dave");
    const token = await asUser(
      alice,
      async (db) =>
        (
          await db.query("select public.create_household_invitation($1, $2) as t", [
            alice.householdId,
            dave.email,
          ])
        ).rows[0].t as string,
      { commit: true },
    );
    await pool.query(
      "update public.household_invitations set expires_at = now() - interval '1 minute' where household_id = $1 and email = $2",
      [alice.householdId, dave.email],
    );
    const code = await expectPgError(
      asUser(dave, (db) => db.query("select public.accept_household_invitation($1)", [token])),
    );
    expect(code).toBe(PG.invalidParameter);
  });
});

describe("accès anonyme et tables réservées", () => {
  it("anon n'a aucun accès aux tables du foyer", async () => {
    for (const table of ["households", "profiles", "household_members", "household_invitations"]) {
      const code = await expectPgError(
        asUser(null, (db) => db.query(`select * from public.${table}`)),
      );
      expect(code, table).toBe(PG.insufficientPrivilege);
    }
  });

  it("anon ne peut pas appeler les fonctions d'invitation", async () => {
    const code = await expectPgError(
      asUser(null, (db) => db.query("select public.accept_household_invitation('x')")),
    );
    expect(code).toBe(PG.insufficientPrivilege);
  });

  it("app_admins est inaccessible aux utilisateurs connectés", async () => {
    const code = await expectPgError(
      asUser(alice, (db) => db.query("select * from public.app_admins")),
    );
    expect(code).toBe(PG.insufficientPrivilege);
  });
});
