# ForgeTrack 🚀

ForgeTrack is a high-end, futuristic Student Tracking and Attendance Management System designed to provide a seamless experience for both mentors and students. Built with a focus on modern aesthetics, real-time data, and AI-driven insights.

![ForgeTrack Banner](https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop)

## ✨ Key Features

### 👨‍🏫 For Mentors
- **Dynamic Dashboard**: Real-time overview of student performance, attendance trends, and recent activities.
- **Attendance Management**: Intuitive interface to mark, edit, and track student attendance for various sessions.
- **Data Import**: Seamlessly upload student lists and session data via CSV/Excel with intelligent mapping.
- **Resource Management**: Upload and manage session materials, notes, and external links.
- **AI-Powered Insights**: Integrated with Google Gemini for generating reports and analyzing student progress.

### 🎓 For Students
- **Personal Dashboard**: Track your own attendance percentage, upcoming sessions, and recently added materials.
- **Attendance History**: Detailed view of all attended and missed sessions.
- **Materials Hub**: Easy access to all session resources, links, and notes shared by mentors.
- **Futuristic UI**: Experience a premium interface with dark mode, glassmorphism, and smooth animations.

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React.js](https://reactjs.org/) (Vite)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **State/Routing**: React Router DOM

### Backend & Database
- **Provider**: [Supabase](https://supabase.com/)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth (Mentor & Student Roles)
- **Logic**: SQL Triggers & Functions for automated user creation.

### AI Integration
- **Model**: [Google Gemini Pro](https://deepmind.google/technologies/gemini/) (via `@google/generative-ai`)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/shreyasdbangeraa/ForgeTrack.git
   cd ForgeTrack
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

3. **Environment Variables**
   Create a `.env.local` file in the `frontend` directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_google_gemini_api_key
   ```

4. **Database Setup**
   - Run the SQL scripts provided in the `backend/` directory in your Supabase SQL Editor:
     1. `schema.sql`: Sets up tables, RLS, and triggers.
     2. `seed.sql`: (Optional) Populates the database with initial data.

5. **Run the Application**
   ```bash
   npm run dev
   ```

## 📂 Project Structure

```text
ForgeTrack/
├── backend/                # Database schemas and migration scripts
│   ├── schema.sql          # Core table structures and RLS policies
│   └── seed.sql            # Initial data for development
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Main application views (Dashboard, Login, etc.)
│   │   ├── lib/            # Utility functions and Supabase client
│   │   └── App.jsx         # Main routing and layout
│   └── public/             # Static assets
└── doc/                    # Project documentation and assets
```

## 📖 Documentation

For more detailed information, check out the following documents:
- [Project Spec Sheet](doc/ForgeTrack%20Spec%20Sheet.md) - Detailed requirements and feature list.
- [Design System](doc/ForgeTrack_Design_System.md) - Colors, typography, and component styling guidelines.

## 🎨 Design Philosophy

ForgeTrack follows a **Neo-Futuristic** design system:
- **Dark Mode First**: Optimized for reduced eye strain and a sleek look.
- **Neon Accents**: Cyberpunk-inspired colors (Electric Blue, Neon Purple) for interactive elements.
- **Glassmorphism**: Translucent panels with subtle blurs for depth.
- **Micro-interactions**: Every click and hover feels alive with Framer Motion animations.
- **Custom Experience**: Includes a unique animated neon cursor for a truly premium feel.

---

Built with ❤️ by the ForgeTrack Team.
