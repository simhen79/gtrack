---
status: accepted
---

# MariaDB 10.11 instead of MySQL 8.4

The database is MariaDB 10.11, Cloudways' default engine, rather than the MySQL 8.4 chosen in ADR 0001. Everything else in ADR 0001 stands: one Cloudways server in Johannesburg, the database on the same server, app-generated UUIDv7 ids and a Redis queue.

## Consequences

- **The "only live rows" unique keys still work.** "One published version per Game" and "one in-progress Practice Session per golfer" use a generated column holding the key only while the row is live, with a unique index on it. MariaDB 10.11 supports indexed generated columns.
- **JSON is text checked for validity, not a native type**, and there are no functional indexes. Anything that needs an index on a derived value uses a generated column instead.
- **Laravel uses its `mariadb` driver**, and CI tests against a MariaDB 10.11 service so test behaviour matches production.
- **The engine is still fixed at server launch.** MariaDB 10.11 is an LTS release supported until about February 2028.
