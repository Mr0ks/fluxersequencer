-- Resolves Fluxline's explicit profile targets without guessing at FLUX's private internals.
local TargetResolver = {}

local function profileNumber(instance: Instance): number?
	for _, attributeName in ipairs({ "FluxProfileNumber", "ProfileNumber", "ProfileId" }) do
		local value = instance:GetAttribute(attributeName)
		if typeof(value) == "number" then return value end
	end
	return tonumber(instance.Name:match("(%d+)$"))
end

function TargetResolver.Select(container: Instance, target): { Instance }
	local mode = target and target.Mode or "all"
	local requested = {}
	for _, number in ipairs(target and target.Profiles or {}) do requested[number] = true end
	local selected = {}
	for _, instance in ipairs(container:GetDescendants()) do
		local number = profileNumber(instance)
		if number then
			local include = mode == "all"
				or (mode == "include" and requested[number] == true)
				or (mode == "exclude" and requested[number] ~= true)
				or (mode == "odd" and number % 2 == 1)
				or (mode == "even" and number % 2 == 0)
			if include then table.insert(selected, instance) end
		end
	end
	return selected
end

return TargetResolver
