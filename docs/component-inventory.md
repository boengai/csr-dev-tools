# CSR Developer Tools - Component Inventory

**Updated:** 2026-03-20 | **Scan Level:** Quick

## Summary

| Category | Count |
|----------|-------|
| Common Components | 30 |
| Feature Components | 96 |
| Icon Components | 18 |
| **Total** | **144** |

## Common Components (`src/components/common/`)

### Layout & Display

| Component | File | Description |
|-----------|------|-------------|
| `Card` | `card/Card.tsx` | Feature tool container card with variants |
| `ProgressBar` | `progress-bar/ProgressBar.tsx` | Animated progress indicator |
| `DataCellTable` | `table/DataCellTable.tsx` | Key-value pair display table |
| `NotoEmoji` | `emoji/NotoEmoji.tsx` | Noto Emoji font renderer |
| `TwinkleStarsAnimate` | `animate/TwinkleStarsAnimate.tsx` | Background star animation (Motion) |
| `CodeOutput` | `output/CodeOutput.tsx` | Formatted code output display |

### Navigation & Search

| Component | File | Description |
|-----------|------|-------------|
| `Sidebar` | `sidebar/Sidebar.tsx` | Categorized tool navigation sidebar |
| `SidebarCategory` | `sidebar/SidebarCategory.tsx` | Sidebar category group |
| `SidebarToolItem` | `sidebar/SidebarToolItem.tsx` | Individual tool link in sidebar |
| `CommandPalette` | `command-palette/CommandPalette.tsx` | Quick search command palette (⌘K) |
| `SearchInput` | `command-palette/SearchInput.tsx` | Search input for command palette |

### Form & Input

| Component | File | Description |
|-----------|------|-------------|
| `Button` | `button/Button.tsx` | Motion-enhanced button with variant styling |
| `CopyButton` | `button/CopyButton.tsx` | One-click copy to clipboard button |
| `TextInput` | `input/TextInput.tsx` | Standard text input |
| `TextAreaInput` | `input/TextAreaInput.tsx` | Multi-line text input |
| `SelectInput` | `input/SelectInput.tsx` | Radix-based select dropdown |
| `UploadInput` | `input/UploadInput.tsx` | File upload input with drag-and-drop |
| `CodeInput` | `input/CodeInput.tsx` | CodeMirror-powered code editor input |
| `ColorInput` | `input/ColorInput.tsx` | Color picker input |
| `CheckboxInput` | `input/CheckboxInput.tsx` | Checkbox input |
| `RadioGroupInput` | `input/RadioGroupInput.tsx` | Radio button group input |
| `RangeInput` | `input/RangeInput.tsx` | Range slider input |
| `SwitchInput` | `input/SwitchInput.tsx` | Radix-based toggle switch |
| `FieldForm` | `form/FieldForm.tsx` | Label + input wrapper component |

### Overlay & Feedback

| Component | File | Description |
|-----------|------|-------------|
| `Dialog` | `dialog/Dialog.tsx` | Radix-based modal dialog |
| `DropdownMenu` | `dropdown-menu/DropdownMenu.tsx` | Radix-based dropdown menu |
| `Tabs` | `tabs/Tabs.tsx` | Radix-based tab navigation |
| `ToastProvider` | `toast/ToastProvider.tsx` | Global toast notifications (Radix + Zustand) |
| `SettingsDialog` | `settings/SettingsDialog.tsx` | User preferences dialog |
| `ToolErrorBoundary` | `error-boundary/ToolErrorBoundary.tsx` | Error boundary for tool components |

### Icons (`src/components/common/icon/`)

| Component | Description |
|-----------|-------------|
| `AlertIcon` | Alert/warning indicator |
| `ArrowIcon` | Directional arrow |
| `CheckIcon` | Checkmark/success |
| `ChevronIcon` | Chevron for dropdowns |
| `CopyIcon` | Copy to clipboard |
| `DownloadIcon` | Download action |
| `GearIcon` | Settings gear |
| `GitHubIcon` | GitHub logo |
| `HamburgerIcon` | Mobile menu toggle |
| `ImageIcon` | Image placeholder |
| `InfoIcon` | Information indicator |
| `ListIcon` | List view toggle |
| `PlusIcon` | Add/create action |
| `RefreshIcon` | Refresh/reload |
| `SearchIcon` | Search action |
| `TrashIcon` | Delete action |
| `UploadIcon` | Upload action |
| `XIcon` | Close/dismiss |

## Feature Components (`src/components/feature/`)

### Code Tools (`code/`) — 14 components

| Component | Description |
|-----------|-------------|
| `CssFormatter` | Format and beautify CSS code |
| `GraphqlSchemaViewer` | Visualize and explore GraphQL schemas |
| `HtmlFormatter` | Format and beautify HTML code |
| `JavaScriptMinifier` | Minify JavaScript code |
| `JsonSchemaValidator` | Validate JSON against JSON Schema (AJV) |
| `JsonToTypeScript` | Generate TypeScript types from JSON |
| `JsonpathEvaluator` | Evaluate JSONPath expressions against JSON data |
| `MarkdownPreview` | Live markdown preview with syntax highlighting |
| `MarkdownTableGenerator` | Generate markdown tables visually |
| `MermaidRenderer` | Render Mermaid diagrams (flowcharts, sequences, etc.) |
| `ProtobufCodec` | Encode/decode Protobuf with base64/hex/raw format support |
| `ProtobufToJson` | Decode Protobuf messages to JSON |
| `SqlFormatter` | Format and beautify SQL queries |
| `TypescriptPlayground` | Full TypeScript editor with Monaco (IntelliSense) |

### Color Tools (`color/`) — 2 components

| Component | Description |
|-----------|-------------|
| `ColorConvertor` | Multi-format color converter (HEX, RGB, HSL, OKLCH, LAB, LCH) |
| `ColorPaletteGenerator` | Generate harmonious color palettes |

### CSS Tools (`css/`) — 6 components

| Component | Description |
|-----------|-------------|
| `BorderRadiusGenerator` | Visual border-radius CSS generator |
| `BoxShadowGenerator` | Visual box-shadow CSS generator |
| `CssAnimationBuilder` | Build CSS animations with keyframe editor |
| `FlexboxPlayground` | Interactive flexbox layout playground |
| `GradientGenerator` | Visual CSS gradient generator |
| `GridPlayground` | Interactive CSS grid layout playground |

### Data Tools (`data/`) — 15 components

| Component | Description |
|-----------|-------------|
| `DataUriGenerator` | Generate data URIs from files |
| `DbDiagram` | Visual database diagram builder (React Flow + DBML) |
| `EnvFileConverter` | Convert between .env formats |
| `EscapedJsonStringifier` | Escape/unescape JSON strings |
| `HtmlEntityConverter` | Encode/decode HTML entities |
| `HtmlToMarkdownConverter` | Convert HTML to Markdown (Turndown) |
| `HttpStatusCodes` | HTTP status code reference |
| `JsonDiffChecker` | Compare two JSON documents and show differences |
| `JsonFormatter` | Format, minify, and validate JSON |
| `JsonToCsvConverter` | Convert JSON arrays to CSV |
| `JsonToTomlConverter` | Convert JSON to TOML format |
| `JsonToXmlConverter` | Convert JSON to XML format |
| `JsonToYamlConverter` | Convert JSON to YAML format |
| `OgPreview` | Preview Open Graph meta tags |
| `YamlFormatter` | Format and validate YAML |

### Encoding Tools (`encoding/`) — 5 components

| Component | Description |
|-----------|-------------|
| `EncodingBase64` | Base64 string codec (encode/decode) |
| `JwtDecoder` | Decode and inspect JWT tokens |
| `NumberBaseConverter` | Convert between number bases (bin, oct, dec, hex) |
| `UrlEncoder` | URL encode/decode strings |
| `UrlParser` | Parse and inspect URL components |

### Generator Tools (`generator/`) — 3 components

| Component | Description |
|-----------|-------------|
| `PasswordGenerator` | Generate secure random passwords |
| `QrCodeGenerator` | Generate QR codes from text/URLs |
| `UuidGenerator` | Generate UUID v4 identifiers |

### Image Tools (`image/`) — 18 components

| Component | Description |
|-----------|-------------|
| `BackgroundRemover` | AI-powered background removal (HuggingFace) |
| `Base64ToImage` | Convert Base64 strings to images |
| `FaviconGenerator` | Generate favicons in multiple sizes |
| `ImageColorPicker` | Pick colors from uploaded images |
| `ImageCompressor` | Compress images with quality control |
| `ImageConvertor` | Convert between image formats with batch/zip |
| `ImageCropper` | Crop images with aspect ratio controls |
| `ImagePreview` | Preview uploaded images |
| `ImageResizer` | Resize images with custom dimensions |
| `ImageResizerControls` | Resize controls sub-component (shared by ImageResizer) |
| `ImageToBase64` | Convert images to Base64 strings |
| `PlaceholderImageGenerator` | Generate placeholder images |
| `SplashScreenGenerator` | Generate iOS splash screens, Android/PWA icons, and manifest files |
| `SvgViewer` | View and inspect SVG files |
| `ImageFormatSelectInput` | Image format selector dropdown (shared input) |
| `ImageQualitySelectInput` | Image quality selector dropdown (shared input) |

### Network Tools (`network/`) — 1 component

| Component | Description |
|-----------|-------------|
| `IpSubnetCalculator` | Calculate IP subnets, CIDR ranges, network info |

### Security Tools (`security/`) — 8 components

| Component | Description |
|-----------|-------------|
| `AesEncryptDecrypt` | AES-256 encryption and decryption |
| `BcryptHasher` | Hash and verify bcrypt passwords |
| `CertificateDecoder` | Decode X.509 certificates |
| `ChmodCalculator` | Calculate Unix file permissions |
| `HashGenerator` | Generate MD5, SHA-1, SHA-256, SHA-512 hashes |
| `HmacGenerator` | Generate HMAC signatures |
| `RsaKeyGenerator` | Generate RSA key pairs |
| `SshKeyFingerprint` | Calculate SSH key fingerprints |

### Text Tools (`text/`) — 8 components

| Component | Description |
|-----------|-------------|
| `LoremIpsumGenerator` | Generate lorem ipsum placeholder text |
| `RegexTester` | Test regular expressions with highlighting |
| `StringEscapeUnescape` | Escape/unescape strings (JSON, HTML, URL, etc.) |
| `TextCaseConverter` | Convert text between cases (camel, snake, kebab, etc.) |
| `TextDiffChecker` | Compare two texts and show differences |
| `TextSortDedupe` | Sort lines and remove duplicates |
| `UserAgentParser` | Parse user agent strings |
| `WordCounter` | Count words, characters, sentences, paragraphs |

### Time Tools (`time/`) — 4 components

| Component | Description |
|-----------|-------------|
| `CronExpressionParser` | Parse cron expressions to human-readable text |
| `CrontabGenerator` | Build cron expressions visually |
| `TimeUnixTimestamp` | Convert between Unix timestamps and dates |
| `TimezoneConverter` | Convert times between timezones |

### Unit Tools (`unit/`) — 2 components

| Component | Description |
|-----------|-------------|
| `AspectRatioCalculator` | Calculate aspect ratios and resize proportionally |
| `UnitPxToRem` | Convert pixel values to REM units |

## Component Patterns

- **Named exports** for all components (`export const Button`)
- **Default exports** only for page components (lazy-loading compatibility)
- **tailwind-variants** for styling via `tv()` wrapper from `@/utils`
- **Radix UI** for accessible primitives (Dialog, Select, Switch, Tabs, Toast, Dropdown Menu)
- **Motion** for animations (`motion.div`, `motion.button`)
- **Barrel exports** via `index.ts` at every folder level
- **Types separated** into `src/types/components/` mirroring component structure
- **Tool registry** drives component loading -- each tool has a lazy import in `tool-registry.ts`
