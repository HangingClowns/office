defmodule Aircloak.AuthController do
  @moduledoc """
  Auth controller responsible for handling Ueberauth responses
  """

  use Aircloak.Web, :controller
  plug Ueberauth

  alias Ueberauth.Strategy.Helpers
  alias Aircloak.User

  def request(conn, _params) do
    render(conn, "request.html", callback_url: Helpers.callback_url(conn))
  end

  def callback(%{assigns: %{ueberauth_failure: fails}} = conn, params) do
    IO.puts("Got fails: #{inspect(fails)}")
    IO.puts("Got params: #{inspect(params)}")
    conn
    |> put_flash(:error, "Failed to authenticate.")
    |> redirect(to: "/ciao/login_failed")
  end

  def callback(%{assigns: %{ueberauth_auth: auth}} = conn, _params) do
    case User.from_auth(auth) do
      {:ok, user} ->
        IO.puts("User: #{inspect(user)}")
        conn
        |> put_flash(:info, "Successfully authenticated.")
        |> Guardian.Plug.sign_in(user)
        |> redirect(to: "/")
      :error ->
        conn
        |> put_flash(:info, "Sorry!")
        |> redirect(to: "/ciao/not_for_you")
    end
  end

  def delete(conn, _params) do
    IO.puts("########### LOGGING OUT ############")
    Guardian.Plug.sign_out(conn)
    |> put_flash(:info, "Logged out successfully.")
    |> redirect(to: "/ciao/logged_out")
  end

  def unauthenticated(conn, _params) do
    redirect(conn, to: "/auth/github")
  end
end
