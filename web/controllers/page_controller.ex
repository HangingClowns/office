defmodule Aircloak.PageController do
  use Aircloak.Web, :controller

  def index(conn, _params) do
    render conn, "index.html", user: Guardian.Plug.current_resource(conn)
  end

  def logged_out(conn, _params) do
    render conn, "logged_out.html"
  end

  def login_failed(conn, _params) do
    render conn, "login_failed.html"
  end

  def not_for_you(conn, _params) do
    render conn, "not_for_you.html"
  end
end
