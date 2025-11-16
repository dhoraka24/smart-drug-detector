# 📤 GitHub-la Project Upload - Complete Guide

## ⚠️ Step 0: Git Install (First Time Only)

### Git Download & Install:
1. **Browser-la open pannunga:**
   - https://git-scm.com/download/win

2. **Download:**
   - "Download for Windows" button click
   - `.exe` file download aagum

3. **Install:**
   - Download aana `.exe` file run pannunga
   - "Next" click pannunga (default settings use pannunga)
   - Install complete aagum podhu "Finish" click

4. **PowerShell Restart:**
   - PowerShell close pannunga
   - New PowerShell open pannunga

5. **Verify:**
   ```powershell
   git --version
   ```
   - Version number varum (e.g., `git version 2.42.0`)

---

## Step 1: GitHub Repository Create

1. **GitHub-la Login:**
   - https://github.com → Login

2. **New Repository:**
   - Top-right corner-la "+" icon → "New repository"
   - **Repository name:** `smart-drug-detector`
   - **Description:** "IoT-based drug vapor detection system with ESP32, FastAPI, and React"
   - **Visibility:** ✅ **Public** (select pannunga)
   - **⚠️ IMPORTANT:** "Initialize with README" **CHECK PANNADHINGA** (we already have README.md)
   - "Create repository" click

3. **Repository URL Note:**
   - Example: `https://github.com/your-username/smart-drug-detector.git`
   - Idha copy pannunga

---

## Step 2: Personal Access Token Create

1. **GitHub Settings:**
   - Profile icon (top-right) → **Settings**

2. **Developer Settings:**
   - Left sidebar → Scroll down → **"Developer settings"**

3. **Personal Access Tokens:**
   - **"Personal access tokens"** → **"Tokens (classic)"**

4. **Generate Token:**
   - **"Generate new token"** → **"Generate new token (classic)"**
   - **Note:** `Smart Drug Detector Upload`
   - **Expiration:** 90 days
   - **Scopes:** ✅ **Check "repo"** (important!)
   - **"Generate token"** click

5. **Token Copy:**
   - Token varum (long string: `ghp_xxxxx...`)
   - **IMMEDIATELY COPY** pannunga (CTRL + C)
   - Safe place-la save pannunga (notepad-la)

---

## Step 3: Project Upload (PowerShell Commands)

### PowerShell Open Pannunga:
- Windows key + X → "Windows PowerShell" or "Terminal"

### Commands Run Pannunga (One by One):

```powershell
# 1. Project directory-la ponga
cd C:\Users\dhora\smart-drug-detector

# 2. Git initialize
git init

# 3. All files add
git add .

# 4. First commit
git commit -m "Initial commit: Smart Drug Detector project"

# 5. GitHub repository connect (YOUR_USERNAME replace pannunga)
git remote add origin https://github.com/YOUR_USERNAME/smart-drug-detector.git

# 6. Main branch set
git branch -M main

# 7. Push to GitHub
git push -u origin main
```

### Step 7-la When Asked:
- **Username:** Your GitHub username (enter pannunga)
- **Password:** Personal Access Token (idha paste pannunga, GitHub password illa!)

---

## ✅ Success!

Upload complete aagum podhu:
- GitHub repository-la ellam files kanum
- Browser-la repository open pannunga → Files kanum

---

## 🔄 Next Time (Code Updates):

```powershell
git add .
git commit -m "Description of changes"
git push
```

---

## 🆘 Troubleshooting

### "git is not recognized":
- Git install pannunga (Step 0)
- PowerShell restart pannunga

### "remote origin already exists":
```powershell
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/smart-drug-detector.git
```

### "Authentication failed":
- Personal Access Token use pannunga (password illa)
- Token correct-a copy pannunga
- Spaces or extra characters irukka check pannunga

### "Permission denied":
- Token-la "repo" scope check pannirukkingala verify pannunga
- Repository public iruntha, no issue

---

## 📝 Quick Checklist

- [ ] Git install panniten
- [ ] GitHub account create panniten
- [ ] Repository create panniten (Public)
- [ ] Personal Access Token create panniten
- [ ] Token copy panniten
- [ ] PowerShell-la commands run panniten
- [ ] GitHub-la files verify panniten

---

**Ippo step-by-step follow pannunga — project GitHub-la upload aagum!** 🚀✅

