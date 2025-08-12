# CSR - Developer Tools

<div align="center">

![CSR Developer Tools](public/web-app-manifest-192x192.png)

**Free online tools for web developers. Speed up your development workflow.**

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Node.js](https://img.shields.io/badge/Node.js->=24.5.0-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.0.6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

[Live Demo](https://your-demo-url.com) • [Report Bug](https://github.com/boengai/csr-dev-tools/issues) • [Request Feature](https://github.com/boengai/csr-dev-tools/issues)

</div>

## ✨ Features

CSR Developer Tools is a collection of essential utilities that work entirely in your browser - no server required, ensuring your data stays private and secure.

### 🎨 **Color Tools**
- **Color Converter** - Convert between HEX, RGB, HSL, and other color formats

### 🔧 **Encoding Tools**
- **Base64 Encoder/Decoder** - Encode and decode Base64 strings instantly

### 🖼️ **Image Tools**
- **Image Converter** - Convert between different image formats (PNG, JPG, WebP, etc.)
- **Image Resize** - Resize images with custom dimensions while maintaining quality

### ⏰ **Time Tools**
- **Unix Timestamp Converter** - Convert between Unix timestamps and human-readable dates

### 📐 **Unit Tools**
- **PX to REM Converter** - Convert pixel values to REM units for responsive design

### 🎛️ **Customizable Layout**
- Drag-and-drop interface to organize your most-used tools
- Persistent layout that remembers your preferences
- Clean, modern UI with dark theme support

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 24.5.0
- **pnpm** 10.11.0 (recommended package manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/boengai/csr-dev-tools.git
   cd csr-dev-tools
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development server**
   ```bash
   pnpm dev
   ```

4. **Open your browser**
   ```
   http://localhost:5173
   ```

### Building for Production

```bash
# Build the application
pnpm build

# Preview the build locally
pnpm preview
```

## 🛠️ Tech Stack

### Core Technologies
- **[React 19](https://react.dev/)** - Latest React with modern features
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Vite](https://vitejs.dev/)** - Fast build tool and dev server
- **[React Router 7](https://reactrouter.com/)** - Client-side routing

### UI & Styling
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible components
- **[Motion One](https://motion.dev/)** - Smooth animations and transitions
- **[Tailwind Variants](https://www.tailwind-variants.org/)** - Component variant management

### State Management
- **[Zustand](https://zustand-demo.pmnd.rs/)** - Lightweight state management

### Development Tools
- **[ESLint](https://eslint.org/)** - Code linting with custom configuration
- **[Prettier](https://prettier.io/)** - Code formatting
- **[Vitest](https://vitest.dev/)** - Unit testing framework

## 📁 Project Structure

```
csr-dev-tools/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── common/        # Common components (buttons, cards, etc.)
│   │   ├── feature/       # Feature-specific components
│   │   └── index.ts       # Component exports
│   ├── constants/         # Application constants
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Page components
│   │   ├── home/          # Main dashboard
│   │   └── showcase/      # Feature showcase
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   ├── App.tsx            # Root application component
│   ├── main.tsx           # Application entry point
│   └── index.css          # Global styles and Tailwind imports
├── package.json
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
└── eslint.config.mjs      # ESLint configuration
```

## 🧩 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server on port 5173 |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run unit tests |

## 🎨 Design System

This project follows a comprehensive design system built on:

### Component Architecture
- **Radix UI** as the foundation for accessible, unstyled components
- **Tailwind CSS** for styling with utility classes
- **Motion One** for smooth animations and transitions

### Code Standards
- **TypeScript strict mode** for type safety
- **Functional components** with React hooks
- **Composition over inheritance** design pattern
- **Mobile-first responsive** design approach

### File Naming Conventions
- **kebab-case** for utility files (`app-version.ts`)
- **PascalCase** for component files (`HomePage.tsx`)
- **camelCase** for hooks and utilities (`useAppVersion.ts`)

## 🌟 Key Features

### Client-Side Only
- **100% client-side processing** - your data never leaves your browser
- **No server dependencies** - works offline after initial load
- **Privacy-focused** - no data collection or tracking

### Modern Development
- **React 19** with latest features and optimizations
- **TypeScript** for enhanced developer experience
- **Hot module replacement** for instant feedback during development
- **Optimized build** with code splitting and tree shaking

### Responsive Design
- **Mobile-first** approach with Tailwind CSS
- **Progressive Web App** capabilities
- **Touch-friendly** interface for mobile devices

## 🔒 Privacy & Security

- **No data collection** - all processing happens locally
- **No external API calls** for core functionality
- **No cookies or tracking** - respects user privacy
- **Offline capable** - works without internet connection

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines

1. Follow the existing code style and conventions
2. Use TypeScript with strict mode enabled
3. Write unit tests for new features
4. Ensure all linting passes before submitting
5. Use semantic commit messages

## 🐛 Bug Reports

If you discover a bug, please [open an issue](https://github.com/boengai/csr-dev-tools/issues) with:

- A clear description of the bug
- Steps to reproduce the issue
- Expected vs actual behavior
- Browser and OS information
- Screenshots if applicable

## 💡 Feature Requests

Have an idea for a new tool? [Open an issue](https://github.com/boengai/csr-dev-tools/issues) with:

- A clear description of the feature
- Use case and benefits
- Any relevant examples or mockups

---

<div align="center">

**Made with ❤️ for the developer community**

[⭐ Star this repo](https://github.com/boengai/csr-dev-tools) if you find it useful!

</div>