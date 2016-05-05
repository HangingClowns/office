defmodule Aircloak.FaceChannel do
  use Aircloak.Web, :channel
  require Logger


  # -------------------------------------------------------------------
  # Phoenix.Channel callback functions
  # -------------------------------------------------------------------

  @doc false
  def join("faces", _, socket) do
    Logger.info("New user connected")
    {:ok, socket}
  end

  @doc false
  def handle_in("update", %{"image" => image}, socket) do
    Logger.info("Got an updated image for user #{socket.assigns.name}")
    broadcast! socket, "update", %{image: image, name: socket.assigns.name}
    {:noreply, socket}
  end

  @doc false
  def terminate(_reason, socket) do
    broadcast! socket, "user_left", %{name: socket.assigns.name}
  end
end
