local Config = require(script.Parent.Config)

local Whitelist = {}

function Whitelist.IsAllowed(player: Player): boolean
	if Config.AllowExperienceOwner and game.CreatorType == Enum.CreatorType.User and player.UserId == game.CreatorId then
		return true
	end
	if table.find(Config.UserIds, player.UserId) or table.find(Config.Usernames, player.Name) then
		return true
	end
	for groupId, minimumRank in pairs(Config.Groups) do
		local ok, rank = pcall(player.GetRankInGroup, player, groupId)
		if ok and rank >= minimumRank then
			return true
		end
	end
	return false
end

return Whitelist
