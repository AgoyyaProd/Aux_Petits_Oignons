import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createUser, expectPgError, pool, type TestUser } from "./helpers";

let lou: TestUser;

beforeAll(async () => {
  lou = await createUser("lou-erreurs");
});

describe("journal des erreurs", () => {
  it("un utilisateur connecté peut signaler une erreur, sans paramètres d'URL", async () => {
    await asUser(
      lou,
      (db) =>
        db.query(
          "select public.report_app_error('client', 'Écran cassé', 'd1', '/recipes/x?q=privé#a', 'abc123')",
        ),
      { commit: true },
    );
    const { rows } = await pool.query(
      "select kind, message, digest, path, release from public.app_errors where digest = 'd1'",
    );
    expect(rows).toEqual([
      {
        kind: "client",
        message: "Écran cassé",
        digest: "d1",
        path: "/recipes/x",
        release: "abc123",
      },
    ]);
  });

  it("ignore un type inconnu et tronque les messages trop longs", async () => {
    await pool.query("select public.report_app_error('autre', 'x')");
    await pool.query("select public.report_app_error('server', $1, 'd2')", ["a".repeat(900)]);
    const { rows } = await pool.query(
      "select kind, char_length(message) as n from public.app_errors where digest = 'd2' or kind not in ('server', 'client')",
    );
    expect(rows).toEqual([{ kind: "server", n: 500 }]);
  });

  it("personne ne peut lire ni écrire la table directement", async () => {
    expect(
      await expectPgError(asUser(lou, (db) => db.query("select * from public.app_errors"))),
    ).toBe("42501");
    expect(
      await expectPgError(
        asUser(lou, (db) =>
          db.query("insert into public.app_errors (kind, message) values ('client', 'x')"),
        ),
      ),
    ).toBe("42501");
  });

  it("les signalements anonymes ont leur propre quota : ils ne masquent pas ceux des connectés", async () => {
    await pool.query(
      `insert into public.app_errors (kind, message, signed_in)
       select 'client', 'spam', false from generate_series(1, 200)`,
    );
    await asUser(
      null,
      (db) => db.query("select public.report_app_error('client', 'anonyme', 'd3')"),
      {
        role: "anon",
        commit: true,
      },
    );
    await asUser(
      lou,
      (db) => db.query("select public.report_app_error('client', 'connecté', 'd4')"),
      {
        commit: true,
      },
    );
    const { rows } = await pool.query(
      "select digest, signed_in from public.app_errors where digest in ('d3', 'd4') order by digest",
    );
    expect(rows).toEqual([{ digest: "d4", signed_in: true }]);
  });
});
