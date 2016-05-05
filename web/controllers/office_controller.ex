defmodule Aircloak.OfficeController do
  use Aircloak.Web, :controller

  def index(conn, _params) do
    render conn, "index.html"
  end
end
