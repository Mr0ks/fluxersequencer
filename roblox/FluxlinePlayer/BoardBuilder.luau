local Workspace = game:GetService("Workspace")

local BoardBuilder = {}
local BOARD_NAME = "FluxlineShowBoard"

local function addCorner(parent, radius)
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, radius)
	corner.Parent = parent
end

local function addStroke(parent, color, transparency)
	local stroke = Instance.new("UIStroke")
	stroke.Color = color
	stroke.Transparency = transparency
	stroke.Thickness = 1
	stroke.Parent = parent
end

function BoardBuilder.EnsureBoard()
	local existing = Workspace:FindFirstChild(BOARD_NAME)
	if existing and existing:IsA("BasePart") then return existing end
	if existing then existing:Destroy() end

	local board = Instance.new("Part")
	board.Name = BOARD_NAME
	board.Anchored = true
	board.CanCollide = true
	board.Size = Vector3.new(10, 6, 0.45)
	board.CFrame = CFrame.new(0, 4, -10)
	board.Color = Color3.fromRGB(10, 10, 15)
	board.Material = Enum.Material.SmoothPlastic
	board.TopSurface = Enum.SurfaceType.Smooth
	board.BottomSurface = Enum.SurfaceType.Smooth
	board:SetAttribute("FluxlineBoard", true)
	board:SetAttribute("Version", 2)
	board.Parent = Workspace

	local display = Instance.new("SurfaceGui")
	display.Name = "Display"
	display.Face = Enum.NormalId.Front
	display.Active = true
	display.AlwaysOnTop = false
	display.LightInfluence = 0
	display.Brightness = 1.2
	display.SizingMode = Enum.SurfaceGuiSizingMode.FixedSize
	display.CanvasSize = Vector2.new(1000, 600)
	display.Parent = board

	local root = Instance.new("Frame")
	root.Name = "Root"
	root.Size = UDim2.fromScale(1, 1)
	root.BackgroundColor3 = Color3.fromRGB(14, 13, 20)
	root.BorderSizePixel = 0
	root.Parent = display

	local accent = Instance.new("Frame")
	accent.Name = "Accent"
	accent.Size = UDim2.new(1, 0, 0, 7)
	accent.BackgroundColor3 = Color3.fromRGB(183, 164, 255)
	accent.BorderSizePixel = 0
	accent.Parent = root

	local title = Instance.new("TextLabel")
	title.Name = "Title"
	title.Size = UDim2.new(1, -64, 0, 64)
	title.Position = UDim2.fromOffset(32, 20)
	title.BackgroundTransparency = 1
	title.Font = Enum.Font.GothamBold
	title.Text = "FLUXLINE  /  SHOW PLAYER"
	title.TextColor3 = Color3.fromRGB(229, 222, 255)
	title.TextSize = 28
	title.TextXAlignment = Enum.TextXAlignment.Left
	title.Parent = root

	local subtitle = Instance.new("TextLabel")
	subtitle.Name = "Subtitle"
	subtitle.Size = UDim2.new(1, -64, 0, 32)
	subtitle.Position = UDim2.fromOffset(34, 77)
	subtitle.BackgroundTransparency = 1
	subtitle.Font = Enum.Font.GothamMedium
	subtitle.Text = "SELECT A SHOW TO PLAY"
	subtitle.TextColor3 = Color3.fromRGB(139, 227, 194)
	subtitle.TextSize = 15
	subtitle.TextXAlignment = Enum.TextXAlignment.Left
	subtitle.Parent = root

	local list = Instance.new("ScrollingFrame")
	list.Name = "Shows"
	list.Size = UDim2.new(1, -64, 1, -205)
	list.Position = UDim2.fromOffset(32, 116)
	list.BackgroundColor3 = Color3.fromRGB(8, 8, 13)
	list.BorderSizePixel = 0
	list.ScrollBarThickness = 7
	list.ScrollBarImageColor3 = Color3.fromRGB(116, 101, 161)
	list.AutomaticCanvasSize = Enum.AutomaticSize.Y
	list.CanvasSize = UDim2.new()
	list.Parent = root
	addCorner(list, 14)
	addStroke(list, Color3.fromRGB(64, 59, 78), 0.25)

	local padding = Instance.new("UIPadding")
	padding.PaddingTop = UDim.new(0, 12)
	padding.PaddingBottom = UDim.new(0, 12)
	padding.PaddingLeft = UDim.new(0, 12)
	padding.PaddingRight = UDim.new(0, 12)
	padding.Parent = list

	local layout = Instance.new("UIListLayout")
	layout.Name = "Layout"
	layout.Padding = UDim.new(0, 10)
	layout.SortOrder = Enum.SortOrder.LayoutOrder
	layout.Parent = list

	local status = Instance.new("TextLabel")
	status.Name = "Status"
	status.Size = UDim2.new(1, -255, 0, 54)
	status.Position = UDim2.new(0, 34, 1, -72)
	status.BackgroundTransparency = 1
	status.Font = Enum.Font.GothamMedium
	status.Text = "Ready"
	status.TextColor3 = Color3.fromRGB(143, 228, 195)
	status.TextSize = 18
	status.TextXAlignment = Enum.TextXAlignment.Left
	status.Parent = root

	local stop = Instance.new("TextButton")
	stop.Name = "Stop"
	stop.Size = UDim2.fromOffset(190, 54)
	stop.Position = UDim2.new(1, -222, 1, -72)
	stop.BackgroundColor3 = Color3.fromRGB(69, 30, 42)
	stop.BorderSizePixel = 0
	stop.AutoButtonColor = true
	stop.Font = Enum.Font.GothamBold
	stop.Text = "STOP SHOW"
	stop.TextColor3 = Color3.fromRGB(255, 174, 185)
	stop.TextSize = 17
	stop.Parent = root
	addCorner(stop, 12)
	addStroke(stop, Color3.fromRGB(127, 58, 75), 0.2)

	return board
end

return BoardBuilder
