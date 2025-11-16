# 📤 GitHub-la Project Upload Pannum Guide

## Step 1: Git Install Pannunga

### Windows-la Git Install:
1. **Git Download:**
   - Browser-la open pannunga: https://git-scm.com/download/win
   - Download button click pannunga
   - `.exe` file download aagum

2. **Git Install:**
   - Download aana `.exe` file run pannunga
   - "Next" click pannunga (default settings use pannunga)
   - Install complete aagum podhu "Finish" click pannunga

3. **Verify Install:**
   - PowerShell or Command Prompt open pannunga
   - Type: `git --version`
   - Version number varum (e.g., `git version 2.42.0`)

---

## Step 2: GitHub Account Create Pannunga

1. **GitHub Website:**
   - Browser-la open pannunga: https://github.com
   - "Sign up" button click pannunga

2. **Account Create:**
   - Email, Username, Password enter pannunga
   - "Create account" click pannunga
   - Email verify pannunga

---

## Step 3: GitHub Repository Create Pannunga

1. **New Repository:**
   - GitHub-la login pannunga
   - Top-right corner-la "+" icon click pannunga
   - "New repository" select pannunga

2. **Repository Details:**
   - **Repository name:** `smart-drug-detector` (or enna name venum)
   - **Description:** "IoT-based drug vapor detection system with ESP32, FastAPI, and React"
   - **Visibility:** Public or Private (your choice)
   - **⚠️ IMPORTANT:** "Initialize with README" **CHECK PANNADHINGA** (we already have README.md)
   - "Create repository" button click pannunga

3. **Repository URL Note Pannunga:**
   - Repository create aagum podhu, URL varum
   - Example: `https://github.com/your-username/smart-drug-detector.git`
   - Idha copy pannunga (next step-la use pannum)

---

## Step 4: Project-la Git Initialize Pannunga

### PowerShell or Command Prompt-la:

1. **Project Directory-la Ponga:**
   ```powershell
   cd C:\Users\dhora\smart-drug-detector
   ```

2. **Git Initialize:**
   ```powershell
   git init
   ```

3. **All Files Add Pannunga:**
   ```powershell
   git add .
   ```

4. **First Commit:**
   ```powershell
   git commit -m "Initial commit: Smart Drug Detector project"
   ```

5. **GitHub Repository Connect Pannunga:**
   ```powershell
   git remote add origin https://github.com/your-username/smart-drug-detector.git
   ```
   ⚠️ **Replace `your-username` with your actual GitHub username!**

6. **Main Branch Name Set Pannunga:**
   ```powershell
   git branch -M main
   ```

7. **GitHub-la Push Pannunga:**
   ```powershell
   git push -u origin main
   ```

8. **GitHub Credentials Enter Pannunga:**
   - Username: Your GitHub username
   - Password: **Personal Access Token** (see Step 5)

---

## Step 5: Personal Access Token Create Pannunga

GitHub-la password use pannadhu, Personal Access Token use pannanum.

1. **GitHub Settings:**
   - GitHub-la login pannunga
   - Top-right corner-la profile icon click pannunga
   - "Settings" click pannunga

2. **Developer Settings:**
   - Left sidebar-la "Developer settings" click pannunga
   - "Personal access tokens" → "Tokens (classic)" click pannunga
   - "Generate new token" → "Generate new token (classic)" click pannunga

3. **Token Details:**
   - **Note:** "Smart Drug Detector Upload"
   - **Expiration:** 90 days (or your choice)
   - **Scopes:** Check "repo" (full control of private repositories)
   - "Generate token" click pannunga

4. **Token Copy Pannunga:**
   - Token generate aagum podhu, **immediately copy pannunga**
   - Token once close pannum podhu, malli kanamattum!
   - Idha save pannunga (password mari use pannum)

---

## Step 6: Push Pannum Podhu Token Use Pannunga

1. **Push Command Run Pannunga:**
   ```powershell
   git push -u origin main
   ```

2. **Credentials Enter:**
   - **Username:** Your GitHub username
   - **Password:** Personal Access Token (Step 5-la create panna token)

3. **Success:**
   - Files upload aagum
   - GitHub repository-la ellam files kanum

---

## Step 7: Verify Pannunga

1. **GitHub Repository Check:**
   - Browser-la GitHub repository open pannunga
   - All files kanum
   - README.md, backend/, frontend/, esp32/ folders kanum

2. **Files Check:**
   - README.md ✅
   - backend/ folder ✅
   - frontend/ folder ✅
   - esp32/ folder ✅
   - .gitignore ✅

---

## ⚠️ Important Notes

### Files NOT Uploaded (`.gitignore` la irukku):
- `venv/` - Python virtual environment
- `node_modules/` - Node.js dependencies
- `.env` - Environment variables (secrets)
- `database.db` - Database file
- `__pycache__/` - Python cache files

### Files Uploaded:
- All source code files
- README.md
- Configuration files
- Documentation files

---

## 🔄 Future Updates Upload Pannum Podhu

### Code Changes Pannum Podhu:

1. **Changes Check:**
   ```powershell
   git status
   ```

2. **Changes Add:**
   ```powershell
   git add .
   ```

3. **Commit:**
   ```powershell
   git commit -m "Description of changes"
   ```

4. **Push:**
   ```powershell
   git push
   ```

---

## 📝 Example Commands (Complete)

```powershell
# 1. Project directory-la ponga
cd C:\Users\dhora\smart-drug-detector

# 2. Git initialize
git init

# 3. All files add
git add .

# 4. First commit
git commit -m "Initial commit: Smart Drug Detector project"

# 5. GitHub repository connect (your username use pannunga)
git remote add origin https://github.com/your-username/smart-drug-detector.git

# 6. Main branch set
git branch -M main

# 7. Push to GitHub
git push -u origin main
```

---

## 🆘 Troubleshooting

### Error: "git is not recognized"
- Git install pannunga (Step 1)
- PowerShell restart pannunga

### Error: "remote origin already exists"
```powershell
git remote remove origin
git remote add origin https://github.com/your-username/smart-drug-detector.git
```

### Error: "Authentication failed"
- Personal Access Token use pannunga (password illa)
- Token correct-a copy pannunga

### Error: "Permission denied"
- Repository private iruntha, token-la "repo" scope check pannunga
- Repository public iruntha, no issue

---

## ✅ Success Checklist

- [ ] Git install panniten
- [ ] GitHub account create panniten
- [ ] Repository create panniten
- [ ] Personal Access Token create panniten
- [ ] Git init panniten
- [ ] Files add panniten
- [ ] Commit panniten
- [ ] Push panniten
- [ ] GitHub-la files verify panniten

---

**Ippo project GitHub-la upload pannalam!** 🚀

Step-by-step follow pannunga — ellam working aagum!

