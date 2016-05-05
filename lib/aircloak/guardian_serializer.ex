defmodule Aircloak.GuardianSerializer do
  @behaviour Guardian.Serializer

  def for_token(user = %{}) do
    encoded_user = user
    |> Poison.encode!
    |> Base.encode64
    {:ok, "User:#{encoded_user}"}
  end
  def for_token(_), do: { :error, "Unknown resource type" }

  def from_token("User:" <> encoded_user) do
    user = encoded_user
    |> Base.decode64!
    |> Poison.decode!
    {:ok, user}
  end
  def from_token(_), do: { :error, "Unknown resource type" }
end
