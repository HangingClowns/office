defmodule Aircloak.User do
  @moduledoc false

  alias Ueberauth.Auth

  def from_auth(%Auth{} = auth) do
    case member_of_aircloak(auth.credentials.token) do
      true ->
        avatar_url = auth.info.urls.avatar_url
        {:ok, %{avatar_url: avatar_url, name: name_from_auth(auth)}}
      false -> :error
    end
  end

  defp name_from_auth(auth) do
    if auth.info.name do
      auth.info.name
    else
      name = [auth.info.first_name, auth.info.last_name]
          |> Enum.filter(&(&1 != nil and &1 != ""))

      cond do
        length(name) == 0 -> auth.info.nickname
        true -> Enum.join(name, " ")
      end
    end
  end

  defp member_of_aircloak(token_str) do
    client = Ueberauth.Strategy.Github.OAuth.client()
    token = OAuth2.AccessToken.new(token_str, client)
    OAuth2.AccessToken.get!(token, "/user/orgs").body
    |> Enum.find(fn(org) -> org["login"] == "Aircloak" end) != nil
  end
end
