# PGx-project

## 🧬 Pharmacogenomics Rulebase (Updated 2025)

This project now supports **6 pharmacogenomic genes** with comprehensive Thai therapeutic recommendations:

| Gene | Alleles Tested | Rules | Status |
|------|---------------|-------|--------|
| **CYP2D6** | *4, *10, *41, CNV intron 2, CNV exon 9 | 33 | ✅ Updated (NEW FORMAT) |
| **CYP2C9** | *2, *3 | 6 | ✅ Active |
| **CYP2C19** | *2, *3, *17 | 10 | ✅ Active |
| **VKORC1** | 1173C>T, -1639G>A | 3 | ✅ Active |
| **CYP3A5** | *3 | 3 | ✅ Active |
| **TPMT** | *3C | 3 | ✅ Active |

### Key Changes
- **CYP2D6** now uses CNV (Copy Number Variation) analysis for intron 2 and exon 9
- All rules include Thai therapeutic recommendations
- Prediction engine supports both Supabase and local JSON fallback

### 🛠️ Quick Management Commands
```powershell
# View current data
node scripts/showRulebaseInfo.js

# Backup from Supabase to JSON
node scripts/backupSupabaseToJson.js

# Upload from JSON to Supabase
node scripts/importJsonToSupabase.js

# Test predictions
node scripts/testRulebase.js

# Test PDF generation with rulebase data
node scripts/testPdfGeneration.js
node scripts/testPdfGeneration.js --all  # Test all DNA types

# Initialize specimen data (Blood, Nails, Hair, Saliva with 7-day SLA)
node scripts/initializeSpecimens.js
```

For detailed documentation, see:
- **[System Status](docs/SYSTEM_STATUS.md)** - Current configuration and status
- **[Management Guide](docs/RULEBASE_MANAGEMENT.md)** - Complete management instructions
- **[Update Guide](docs/RULEBASE_UPDATE.md)** - Implementation details
- [AI Coding Instructions](.github/copilot-instructions.md) - Architecture overview

## 🧪 Specimen Management

The system supports multiple specimen types with configurable TAT (Turnaround Time):
- **Blood** - Default: 5 days
- **Nails** - Default: 10 days  
- **Hair** - Default: 5 days
- **Saliva** - Default: 7 days

Manage specimens through Admin Settings page or use the initialization script.

## Verify PDF page (ตรวจสอบไฟล์ PDF)

หน้า `view/verify_information.html` ใช้สำหรับแสดงไฟล์ PDF เพื่อให้ผู้ใช้ตรวจสอบและกดยืนยัน/ปฏิเสธ

- เปิดหน้า: `view/verify_information.html`
- ค่าเริ่มต้นจะพยายามโหลดไฟล์: `view/mockuppdf.pdf` (อ้างอิงแบบ relative จาก HTML)
- สามารถระบุไฟล์เองผ่านพารามิเตอร์ `?pdf=` ได้ เช่น:

		- ไฟล์ภายในโปรเจกต์ (relative):
			`verify_information.html?pdf=mockuppdf.pdf`

	- File URL:
		`verify_information.html?pdf=file:///C:/Users/<you>/Downloads/mockuppdf.pdf`

ปุ่ม “ยืนยัน” จะไปที่ `verify_step1.html` และปุ่ม “ปฏิเสธ” จะกลับไปที่ `information.html` (สามารถปรับเส้นทางได้ใน `view/js/verify_information.js`)



## Getting started

To make it easy for you to get started with GitLab, here's a list of recommended next steps.

Already a pro? Just edit this README.md and make it your own. Want to make it easy? [Use the template at the bottom](#editing-this-readme)!

## Add your files

- [ ] [Create](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#create-a-file) or [upload](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#upload-a-file) files
- [ ] [Add files using the command line](https://docs.gitlab.com/topics/git/add_files/#add-files-to-a-git-repository) or push an existing Git repository with the following command:

```
cd existing_repo
git remote add origin https://gitlab.com/the-boys-group/pgx-project.git
git branch -M main
git push -uf origin main
```

## Integrate with your tools

- [ ] [Set up project integrations](https://gitlab.com/the-boys-group/pgx-project/-/settings/integrations)

## Collaborate with your team

- [ ] [Invite team members and collaborators](https://docs.gitlab.com/ee/user/project/members/)
- [ ] [Create a new merge request](https://docs.gitlab.com/ee/user/project/merge_requests/creating_merge_requests.html)
- [ ] [Automatically close issues from merge requests](https://docs.gitlab.com/ee/user/project/issues/managing_issues.html#closing-issues-automatically)
- [ ] [Enable merge request approvals](https://docs.gitlab.com/ee/user/project/merge_requests/approvals/)
- [ ] [Set auto-merge](https://docs.gitlab.com/user/project/merge_requests/auto_merge/)

## Test and Deploy

Use the built-in continuous integration in GitLab.

- [ ] [Get started with GitLab CI/CD](https://docs.gitlab.com/ee/ci/quick_start/)
- [ ] [Analyze your code for known vulnerabilities with Static Application Security Testing (SAST)](https://docs.gitlab.com/ee/user/application_security/sast/)
- [ ] [Deploy to Kubernetes, Amazon EC2, or Amazon ECS using Auto Deploy](https://docs.gitlab.com/ee/topics/autodevops/requirements.html)
- [ ] [Use pull-based deployments for improved Kubernetes management](https://docs.gitlab.com/ee/user/clusters/agent/)
- [ ] [Set up protected environments](https://docs.gitlab.com/ee/ci/environments/protected_environments.html)

***

# Editing this README

When you're ready to make this README your own, just edit this file and use the handy template below (or feel free to structure it however you want - this is just a starting point!). Thanks to [makeareadme.com](https://www.makeareadme.com/) for this template.

## Suggestions for a good README

Every project is different, so consider which of these sections apply to yours. The sections used in the template are suggestions for most open source projects. Also keep in mind that while a README can be too long and detailed, too long is better than too short. If you think your README is too long, consider utilizing another form of documentation rather than cutting out information.

## Name
Choose a self-explaining name for your project.

## Description
Let people know what your project can do specifically. Provide context and add a link to any reference visitors might be unfamiliar with. A list of Features or a Background subsection can also be added here. If there are alternatives to your project, this is a good place to list differentiating factors.

## Badges
On some READMEs, you may see small images that convey metadata, such as whether or not all the tests are passing for the project. You can use Shields to add some to your README. Many services also have instructions for adding a badge.

## Visuals
Depending on what you are making, it can be a good idea to include screenshots or even a video (you'll frequently see GIFs rather than actual videos). Tools like ttygif can help, but check out Asciinema for a more sophisticated method.

## Installation
Within a particular ecosystem, there may be a common way of installing things, such as using Yarn, NuGet, or Homebrew. However, consider the possibility that whoever is reading your README is a novice and would like more guidance. Listing specific steps helps remove ambiguity and gets people to using your project as quickly as possible. If it only runs in a specific context like a particular programming language version or operating system or has dependencies that have to be installed manually, also add a Requirements subsection.

## Usage
Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

## Support
Tell people where they can go to for help. It can be any combination of an issue tracker, a chat room, an email address, etc.

## Roadmap
If you have ideas for releases in the future, it is a good idea to list them in the README.

## Contributing
State if you are open to contributions and what your requirements are for accepting them.

For people who want to make changes to your project, it's helpful to have some documentation on how to get started. Perhaps there is a script that they should run or some environment variables that they need to set. Make these steps explicit. These instructions could also be useful to your future self.

You can also document commands to lint the code or run tests. These steps help to ensure high code quality and reduce the likelihood that the changes inadvertently break something. Having instructions for running tests is especially helpful if it requires external setup, such as starting a Selenium server for testing in a browser.

## Authors and acknowledgment
Show your appreciation to those who have contributed to the project.

## License
For open source projects, say how it is licensed.

## Project status
If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.
