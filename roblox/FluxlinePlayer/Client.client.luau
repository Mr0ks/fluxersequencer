local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local remotes = ReplicatedStorage:WaitForChild("FluxlinePlayerRemotes")
local authorize = remotes:WaitForChild("Authorize")
local audit = remotes:WaitForChild("Audit")

local board = workspace:WaitForChild("FluxlineShowBoard")
local gui = board:WaitForChild("Display")
local root = gui:WaitForChild("Root")
local list = root:WaitForChild("Shows")
local status = root:WaitForChild("Status")
local stop = root:WaitForChild("Stop")

local allowed, reason = authorize:InvokeServer("open")
if not allowed then
	gui.Enabled = false
	warn("[Fluxline] " .. tostring(reason))
	return
end

local function approved(action, showName)
	local ok, message = authorize:InvokeServer(action, showName)
	if not ok then warn("[Fluxline] " .. tostring(message)) end
	return ok
end

local accel = workspace:FindFirstChild("AccelSystemsFKTC")
local accelRemotes = accel and accel:FindFirstChild("remotes")
if not accelRemotes then
	status.Text = "AccelSystemsFKTC was not found"
	status.TextColor3 = Color3.fromRGB(255, 189, 106)
	return
end

for _, child in list:GetChildren() do
	if child:IsA("GuiButton") then child:Destroy() end
end

local function playShow(showName)
	if not approved("play", showName) then return end
	status.Text = "Playing  /  " .. showName
	accelRemotes.selectSong:FireServer(showName)
	audit:FireServer("play", showName)
end

local function addShow(showName, order)
	local button = Instance.new("TextButton")
	button.Name = showName
	button.LayoutOrder = order
	button.Size = UDim2.new(1, -4, 0, 68)
	button.BackgroundColor3 = Color3.fromRGB(35, 31, 47)
	button.BorderSizePixel = 0
	button.AutoButtonColor = true
	button.Font = Enum.Font.GothamSemibold
	button.Text = "   PLAY   " .. showName
	button.TextColor3 = Color3.fromRGB(239, 235, 248)
	button.TextSize = 20
	button.TextXAlignment = Enum.TextXAlignment.Left
	button.Parent = list

	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, 11)
	corner.Parent = button

	local stroke = Instance.new("UIStroke")
	stroke.Color = Color3.fromRGB(88, 78, 112)
	stroke.Transparency = 0.4
	stroke.Parent = button

	button.Activated:Connect(function() playShow(showName) end)
end

local ok, shows = pcall(function()
	return accelRemotes.getShows:InvokeServer()
end)

if ok and typeof(shows) == "table" then
	local source = shows.shows or shows
	local names = {}
	for showName in pairs(source) do table.insert(names, tostring(showName)) end
	table.sort(names)
	for index, showName in ipairs(names) do addShow(showName, index) end
	status.Text = #names > 0 and (tostring(#names) .. " shows ready") or "No shows found in AccelSystems"
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
