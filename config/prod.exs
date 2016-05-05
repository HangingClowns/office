use Mix.Config

config :aircloak, Aircloak.Endpoint,
  http: [port: {:system, "PORT"}],
  url: [host: "office.aircloak.com", scheme: :https, port: 443],
  cache_static_manifest: "priv/static/manifest.json",
  secret_key_base: System.get_env("SECRET_KEY_BASE")

config :aircloak, Aircloak.Repo,
  adapter: Ecto.Adapters.Postgres,
  url: System.get_env("DATABASE_URL"),
  pool_size: 20,
  ssl: true

# Do not print debug messages in production
config :logger, level: :info

config :ueberauth, Ueberauth.Strategy.Github.OAuth,
  client_id: System.get_env("GITHUB_CLIENT_ID"),
  client_secret: System.get_env("GITHUB_CLIENT_SECRET")

config :guardian, Guardian,
  secret_key: System.get_env("GUARDIAN_SECRET_KEY")
