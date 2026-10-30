# 🐾 Adopt Me — Pet Adoption & Animal Rescue Platform

A full-stack pet adoption, animal rescue, and post-adoption welfare monitoring platform connecting adopters and animal welfare organizations (NGOs / Shelters).

---

## 🌟 Key Features

- **🐾 Pet Discovery & Filtering**: Search through shelter listings by species, breed, age, size, gender, and vaccination status.
- **📝 Digital Declarations**: Transparent, secure digital adoption agreement signatures.
- **⏱️ Automated 7-Day Trial System**: Automated adoption trial tracking with background hourly cron jobs and real-time status transitions.
- **📋 3-Month Post-Adoption Welfare Monitoring**: Regular mandatory health, behavior, and photo check-ins reviewed directly by shelters.
- **🚨 Real-Time Emergency SOS & Rescue**: Geolocation-enabled reporting for injured/stray animals with photos, urgency levels, and instant Socket.IO broadcasting to NGOs.
- **🏢 NGO Dashboard**: Complete administration suite for pet inventory, application approvals, trial tracking, and emergency response management.

---

## 🛠️ Tech Stack

### Frontend
- **React 18** (Vite)
- **React Router v6**
- **Socket.io Client** (Real-time updates)
- **Axios**, **React Hot Toast**, **React Dropzone**, **Date-fns**
- **Vanilla CSS**

### Backend
- **Node.js** & **Express.js**
- **MongoDB** & **Mongoose**
- **Socket.io** (Real-time events)
- **node-cron** (Automated trial expiration tasks)
- **JWT** (JSON Web Tokens) & **bcryptjs**
- **Multer** (Media & document uploads)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (Local instance or MongoDB Atlas cluster)

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT Secret
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` and backend runs at `http://localhost:5000`.

---

## 📄 License
MIT License.
