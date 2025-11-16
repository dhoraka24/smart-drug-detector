# 🔑 GitHub Personal Access Token Create Pannum Guide

## Step-by-Step Instructions

### Step 1: GitHub-la Login Pannunga
1. Browser-la open pannunga: **https://github.com**
2. Login pannunga (username and password)

---

### Step 2: Settings-la Ponga
1. GitHub page-la **top-right corner-la profile icon** click pannunga
2. Dropdown menu-la **"Settings"** click pannunga

---

### Step 3: Developer Settings-la Ponga
1. Left sidebar-la scroll pannunga
2. Bottom-la **"Developer settings"** click pannunga
   - (Settings page-la left side-la irukku)

---

### Step 4: Personal Access Tokens-la Ponga
1. **"Personal access tokens"** section-la
2. **"Tokens (classic)"** click pannunga
   - (New token types irunthalum, classic use pannunga)

---

### Step 5: New Token Generate Pannunga
1. **"Generate new token"** button click pannunga
2. **"Generate new token (classic)"** select pannunga

---

### Step 6: Token Details Fill Pannunga

**Note (Name):**
- Type: `Smart Drug Detector Upload`
- (Enna name venum nu type pannunga)

**Expiration:**
- Select: **90 days** (or enna duration venum)
- (No expiration select pannalam, but security ku 90 days better)

**Scopes (Permissions):**
- ✅ **Check "repo"** - Full control of private repositories
  - This is the most important one!
  - Idha check pannunga

**Other scopes (optional):**
- "workflow" - if you need GitHub Actions
- "write:packages" - if you need to upload packages

---

### Step 7: Generate Token
1. Scroll down
2. **"Generate token"** (green button) click pannunga

---

### Step 8: Token Copy Pannunga ⚠️ IMPORTANT
1. Token generate aagum podhu, **long string** varum
   - Example: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
2. **IMMEDIATELY COPY PANNUNGA!**
   - Select pannunga → `CTRL + C`
   - Or "Copy" button click pannunga

3. **⚠️ WARNING:**
   - Token once page close pannum podhu, **malli kanamattum!**
   - So **now copy pannunga** and **save pannunga** (notepad-la or safe place-la)

---

### Step 9: Token Use Pannunga

**Git Push Pannum Podhu:**
```powershell
git push -u origin main
```

**When Asked:**
- **Username:** Your GitHub username
- **Password:** **Personal Access Token** (idha paste pannunga, password illa!)

---

## 📸 Visual Guide

### Settings Path:
```
GitHub.com
  → Profile Icon (top-right)
    → Settings
      → Developer settings (left sidebar, bottom)
        → Personal access tokens
          → Tokens (classic)
            → Generate new token
              → Generate new token (classic)
```

---

## ✅ Checklist

- [ ] GitHub-la login panniten
- [ ] Settings-la ponaen
- [ ] Developer settings-la ponaen
- [ ] Personal access tokens-la ponaen
- [ ] "Generate new token (classic)" click panniten
- [ ] Note fill panniten
- [ ] Expiration select panniten
- [ ] "repo" scope check panniten
- [ ] "Generate token" click panniten
- [ ] Token copy panniten
- [ ] Token safe place-la save panniten

---

## 🆘 Troubleshooting

### "Generate new token" button kanamattum:
- GitHub-la login pannirukkingala check pannunga
- Settings page-la correct-a irukkingala check pannunga

### "repo" scope kanamattum:
- Scroll down pannunga
- "repo" section-la irukku

### Token copy pannum podhu error:
- Token select pannunga → Right-click → Copy
- Or manually select pannunga → `CTRL + C`

### Token use pannum podhu "Authentication failed":
- Token correct-a copy pannirukkingala check pannunga
- Spaces or extra characters irukka check pannunga
- Token expired aagirukka check pannunga (90 days)

---

## 💡 Tips

1. **Token Save Pannunga:**
   - Notepad-la save pannunga
   - Or password manager-la save pannunga
   - Next time use pannalam

2. **Token Security:**
   - Token password mari important
   - Yarum share pannadhinga
   - Public place-la post pannadhinga

3. **Token Expiry:**
   - 90 days expire aagum
   - Expire aagum podhu, new token create pannunga

---

**Ippo token create pannunga — GitHub-la project upload pannalam!** 🔑✅

