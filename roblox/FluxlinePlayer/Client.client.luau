local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local remotes = ReplicatedStorage:WaitForChild("FluxlinePlayerRemotes")
local authorize = remotes:WaitForChild("Authorize")
local audit = remotes:WaitForChild("Audit")
local accel = workspace:WaitForChild("AccelSystemsFKTC")
local accelRemotes = accel:WaitForChild("remotes")

local allowed, reason = authorize:InvokeServer("open")
if not allowed then
	warn("[Fluxline] " .. tostring(reason))
	return
end

local function approved(action, showName)
	local ok, message = authorize:InvokeServer(action, showName)
	if not ok then warn("[Fluxline] " .. tostring(message)) end
	return ok
end

local gui = Instance.new("ScreenGui")
gui.Name = "FluxlineShowBoard"
gui.ResetOnSpawn = false
gui.DisplayOrder = 50
gui.Parent = player:WaitForChild("PlayerGui")

local root = Instance.new("Frame")
root.Name = "Board"
root.Size = UDim2.fromOffset(420, 430)
root.Position = UDim2.new(0.5, -210, 0.5, -215)
root.BackgroundColor3 = Color3.fromRGB(16, 16, 22)
root.BorderSizePixel = 0
root.Parent = gui
Instance.new("UICorner", root).CornerRadius = UDim.new(0, 16)

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, -32, 0, 64)
title.Position = UDim2.fromOffset(16, 8)
title.BackgroundTransparency = 1
title.Font = Enum.Font.GothamBold
title.Text = "FLUXLINE  /  SHOW PLAYER"
title.TextColor3 = Color3.fromRGB(224, 217, 255)
title.TextSize = 18
title.TextXAlignment = Enum.TextXAlignment.Left
title.Parent = root

local list = Instance.new("ScrollingFrame")
list.Size = UDim2.new(1, -32, 1, -142)
list.Position = UDim2.fromOffset(16, 68)
list.BackgroundColor3 = Color3.fromRGB(11, 11, 16)
list.BorderSizePixel = 0
list.ScrollBarThickness = 4
list.AutomaticCanvasSize = Enum.AutomaticSize.Y
list.CanvasSize = UDim2.new()
list.Parent = root
Instance.new("UICorner", list).CornerRadius = UDim.new(0, 10)
local layout = Instance.new("UIListLayout", list)
layout.Padding = UDim.new(0, 6)

local status = Instance.new("TextLabel")
status.Size = UDim2.new(1, -32, 0, 28)
status.Position = UDim2.new(0, 16, 1, -66)
status.BackgroundTransparency = 1
status.Font = Enum.Font.Gotham
status.Text = "Ready"
status.TextColor3 = Color3.fromRGB(143, 228, 195)
status.TextSize = 12
status.TextXAlignment = Enum.TextXAlignment.Left
status.Parent = root

local stop = Instance.new("TextButton")
stop.Size = UDim2.fromOffset(110, 36)
stop.Position = UDim2.new(1, -126, 1, -52)
stop.BackgroundColor3 = Color3.fromRGB(67, 31, 40)
stop.BorderSizePixel = 0
stop.Font = Enum.Font.GothamBold
stop.Text = "STOP SHOW"
stop.TextColor3 = Color3.fromRGB(255, 171, 181)
stop.TextSize = 11
stop.Parent = root
Instance.new("UICorner", stop).CornerRadius = UDim.new(0, 9)

local function playShow(showName)
	if not approved("play", showName) then return end
	status.Text = "Playing  /  " .. showName
	accelRemotes.selectSong:FireServer(showName)
	audit:FireServer("play", showName)
end

local function addShow(showName)
	local button = Instance.new("TextButton")
	button.Size = UDim2.new(1, -12, 0, 48)
	button.BackgroundColor3 = Color3.fromRGB(31, 29, 41)
	button.BorderSizePixel = 0
	button.Font = Enum.Font.GothamSemibold
	button.Text = "  ▶   " .. showName
	button.TextColor3 = Color3.fromRGB(235, 232, 242)
	button.TextSize = 13
	button.TextXAlignment = Enum.TextXAlignment.Left
	button.Parent = list
	Instance.new("UICorner", button).CornerRadius = UDim.new(0, 9)
	button.Activated:Connect(function() playShow(showName) end)
end

local ok, shows = pcall(function() return accelRemotes.getShows:InvokeServer() end)
if ok and typeof(shows) == "table" then
	local source = shows.shows or shows
	for showName in pairs(source) do addShow(tostring(showName)) end
else
	status.Text = "Could not read Accel shows"
	status.TextColor3 = Color3.fromRGB(255, 189, 106)
end

stop.Activated:Connect(function()
	if not approved("stop") then return end
	status.Text = "Stopped"
	accelRemotes.soundRemote:FireServer("stop")
	audit:FireServer("stop")
end)
