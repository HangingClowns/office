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
  def handle_in("update", %{"face" => face}, socket) do
    Logger.info("Got an updated image for user #{socket.assigns.name}")
    broadcast! socket, "update", %{face: face, name: socket.assigns.name}
    {:noreply, socket}
  end

  def handle_in("state:" <> state_name, %{"state" => state}, socket) do
    Logger.info("Marking user #{socket.assigns.name} as #{state_name} = #{state}")
    broadcast! socket, state_name, %{name: socket.assigns.name, state: state}
    {:noreply, socket}
  end

  intercept ["update"]
  @doc false
  def handle_out("update", %{name: name} = update, socket) do
    if (name != socket.assigns.name) or (Mix.env == :dev) do
      push socket, "update", update
    end
    {:noreply, socket}
  end

  @doc false
  def terminate(_reason, socket) do
    broadcast! socket, "user_left", %{name: socket.assigns.name}
  end
end
