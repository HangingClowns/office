ExUnit.start

Mix.Task.run "ecto.create", ~w(-r Aircloak.Repo --quiet)
Mix.Task.run "ecto.migrate", ~w(-r Aircloak.Repo --quiet)
Ecto.Adapters.SQL.begin_test_transaction(Aircloak.Repo)

