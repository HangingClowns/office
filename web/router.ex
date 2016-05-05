defmodule Aircloak.Router do
  @moduledoc false

  use Aircloak.Web, :router
  require Ueberauth

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :authenticated do
    plug Guardian.Plug.VerifySession
    plug Guardian.Plug.EnsureAuthenticated, handler: Aircloak.AuthController
    plug Guardian.Plug.LoadResource
  end

  scope "/auth", Aircloak do
    pipe_through [:browser]

    get "/:provider", AuthController, :request
    get "/:provider/callback", AuthController, :callback
    post "/:provider/callback", AuthController, :callback
    delete "/logout", AuthController, :delete
  end

  scope "/", Aircloak do
    pipe_through [:browser, :authenticated] # Use the default browser stack
    get "/", OfficeController, :index
  end

  scope "/ciao", Aircloak do
    pipe_through [:browser] # Use the default browser stack
    get "/", PageController, :logged_out
    get "/logged_out", PageController, :logged_out
    get "/login_failed", PageController, :login_failed
    get "/not_for_you", PageController, :not_for_you
  end
end
