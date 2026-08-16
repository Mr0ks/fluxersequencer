local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local packageFolder = script.Parent
local Whitelist = require(packageFolder.Whitelist)
local BoardBuilder = require(packageFolder.BoardBuilder)

BoardBuilder.EnsureBoard()

local remotes = ReplicatedStorage:FindFirstChild("FluxlinePlayerRemotes") or Instance.new("Folder")
remotes.Name = "FluxlinePlayerRemotes"
remotes.Parent = ReplicatedStorage

local authorize = remotes:FindFirstChild("Authorize") or Instance.new("RemoteFunction")
authorize.Name = "Authorize"
authorize.Parent = remotes

local audit = remotes:FindFirstChild("Audit") or Instance.new("RemoteEvent")
audit.Name = "Audit"
audit.Parent = remotes

authorize.OnServerInvoke = function(player, action, showName)
	if not Whitelist.IsAllowed(player) then
		warn(("[Fluxline] blocked %s (%d): %s"):format(player.Name, player.UserId, tostring(action)))
		return false, "You are not on the Fluxline whitelist."
	end
	if typeof(action) ~= "string" or #action > 30 then return false, "Invalid action." end
	if showName ~= nil and (typeof(showName) ~= "string" or #showName > 100) then return false, "Invalid show." end
	print(("[Fluxline] %s approved for %s%s"):format(action, player.Name, showName and (" - " .. showName) or ""))
	return true
end

audit.OnServerEvent:Connect(function(player, action, showName)
	if Whitelist.IsAllowed(player) then
		print(("[Fluxline] %s: %s - %s"):format(player.Name, tostring(action), tostring(showName)))
	end
end)

Players.PlayerRemoving:Connect(function(player)
	-- Reserved for per-user board state. No persistent personal data is stored.
end)
