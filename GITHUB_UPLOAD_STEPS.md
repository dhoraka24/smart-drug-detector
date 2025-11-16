# 📤 GitHub-la Project Upload - Exact Steps

## Step 1: Git Install Check

PowerShell-la run pannunga:
```powershell
git --version
```

**If error varum:**
- Git install pannunga: https://git-scm.com/download/win
- Install complete aagum podhu PowerShell restart pannunga

---

## Step 2: GitHub Repository Create

1. **GitHub-la Login:**
   - https://github.com → Login

2. **New Repository:**
   - Top-right corner-la "+" icon → "New repository"
   - **Repository name:** `smart-drug-detector`
   - **Description:** "IoT-based drug vapor detection system"
   - **Visibility:** Public ✅
   - **⚠️ IMPORTANT:** "Initialize with README" **CHECK PANNADHINGA** (we already have README.md)
   - "Create repository" click

3. **Repository URL Copy:**
   - Example: `https://github.com/your-username/smart-drug-detector.git`
   - Idha copy pannunga

---

## Step 3: Personal Access Token Create

1. **GitHub Settings:**
   - Profile icon (top-right) → Settings

2. **Developer Settings:**
   - Left sidebar → Scroll down → "Developer settings"

3. **Personal Access Tokens:**
   - "Personal access tokens" → "Tokens (classic)"

4. **Generate Token:**
   - "Generate new token" → "Generate new token (classic)"
   - **Note:** `Smart Drug Detector`
   - **Expiration:** 90 days
   - **Scopes:** ✅ Check "repo"
   - "Generate token" click

5. **Token Copy:**
   - Token varum → **IMMEDIATELY COPY** pannunga
   - Safe place-la save pannunga

---

## Step 4: Project Upload (PowerShell Commands)

### Project Directory-la Ponga:
```powershell
cd C:\Users\dhora\smart-drug-detector
```

### Git Initialize:
```powershell
git init
```

### All Files Add:
```powershell
git add .
```

### First Commit:
```powershell
git commit -m "Initial commit: Smart Drug Detector project"
```

### GitHub Repository Connect:
```powershell
git remote add origin https://github.com/YOUR_USERNAME/smart-drug-detector.git
```
⚠️ **Replace `YOUR_USERNAME` with your actual GitHub username!**

### Main Branch Set:
```powershell
git branch -M main
```

### Push to GitHub:
```powershell
git push -u origin main
```

### When Asked:
- **Username:** Your GitHub username
- **Password:** Personal Access Token (idha paste pannunga, GitHub password illa!)

---

## ✅ Success!

Upload complete aagum podhu:
- GitHub repository-la ellam files kanum
- README.md, backend/, frontend/, esp32/ folders kanum

---

## 🔄 Next Time (Updates):

Code change pannum podhu:
```powershell
git add .
git commit -m "Description of changes"
git push
```

---

## 🆘 Troubleshooting

### "git is not recognized":
- Git install pannunga
- PowerShell restart pannunga

### "remote origin already exists":
```powershell
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/smart-drug-detector.git
```

### "Authentication failed":
- Personal Access Token use pannunga (password illa)
- Token correct-a copy pannunga

---

**Ippo step-by-step follow pannunga — project GitHub-la upload aagum!** 🚀✅

