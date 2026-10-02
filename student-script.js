// ==========================================
// ⚙️ المتغيرات الأساسية ودوال التنقل بين الشاشات
// ==========================================
let globalTeacherId = "ElSenior_System_Master"; // 🔒 التثبيت هنا
let currentStudent = null;
let allOnlineExams = [];
let currentExam = null;
let examTimerInterval = null;
window.allLectures = []; 
window.allClassSessions = []; 
window.studentLecPath = { level: null, term: null, month: null };

// تحميل مكتبة الاحتفالات (Confetti) تلقائياً
if (!document.getElementById('confetti-script')) {
    let script = document.createElement('script');
    script.id = 'confetti-script';
    script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js";
    document.head.appendChild(script);
}

// 🔘 دوال فتح وقفل النوافذ (شاشة المودال) مربوطة بـ window للحماية من التشفير
window.openAuthModal = function(type) {
    document.getElementById('auth-modal').classList.add('active');
    window.toggleAuthView(type);
};

window.closeAuthModal = function() {
    document.getElementById('auth-modal').classList.remove('active');
};

window.toggleAuthView = function(type) {
    document.getElementById('login-form-view').style.display = 'none';
    document.getElementById('register-form-view').style.display = 'none';
    
    let forgotView = document.getElementById('forgot-form-view');
    if(forgotView) forgotView.style.display = 'none';

    if(type === 'login') {
        document.getElementById('login-form-view').style.display = 'block';
    } else if (type === 'register') {
        document.getElementById('register-form-view').style.display = 'block';
    } else if (type === 'forgot') {
        if(forgotView) forgotView.style.display = 'block';
    }
};

// ==========================================
// 🎨 سحر الألوان: تطبيق الثيم بناءً على الصف
// ==========================================
function applyDynamicTheme(level) {
    document.body.classList.remove('theme-grade-1', 'theme-grade-2', 'theme-grade-3');
    if (level.includes('الأول')) document.body.classList.add('theme-grade-1');
    else if (level.includes('الثاني')) document.body.classList.add('theme-grade-2');
    else if (level.includes('الثالث')) document.body.classList.add('theme-grade-3');
}

document.getElementById("regLevel")?.addEventListener("change", function() {
    applyDynamicTheme(this.value);
});

// الرسالة التحفيزية المتغيرة
function setDailyMotivation() {
    const quotes = [
        "النجاح لا يأتي بالصدفة، بل بالعمل الجاد والمثابرة يا بطل! 💪",
        "تعب اليوم هو راحة وفخر الغد.. استمر في السعي! 🎯",
        "كل دقيقة تقضيها في المذاكرة تقربك خطوة من حلمك. ✨",
        "لا تستسلم أبداً، الأشياء العظيمة تستغرق وقتاً. ⏳",
        "أنت أقوى مما تتخيل، ودرجتك النهائية في الإنجليزي مضمونة لو ركزت! 💯",
        "سر النجاح هو الثبات على الهدف.. ابدأ الآن ولا تؤجل. 🚀"
    ];
    let randomIndex = Math.floor(Math.random() * quotes.length);
    let quoteEl = document.getElementById("daily-motivation");
    if(quoteEl) quoteEl.innerText = `"${quotes[randomIndex]}"`;
}

// ==========================================
// 🌟 1. جلب بيانات المستر وتوزيعها
// ==========================================
async function loadTeacherInfoInitial() {
    try {
        let res = await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/data/settings.json`);
        let settings = await res.json();
        
        if (settings) {
            let tName = settings.teacherName || "سامي سمير";
            let cName = settings.centerName || "El-Senior";

            if(document.getElementById("nav-brand-name")) document.getElementById("nav-brand-name").innerText ="El-Senior";
            if(document.getElementById("hero-teacher-name")) document.getElementById("hero-teacher-name").innerText = `مستر ${tName}`;
            if(document.getElementById("modal-teacher-name")) document.getElementById("modal-teacher-name").innerText = `MR ${tName}`;
            if(document.getElementById("top-name")) document.getElementById("top-name").innerText = `مرحباً بك!`;

            const landingContactBox = document.getElementById("landing-contact-box");
            const modalContactBox = document.getElementById("teacher-contact-box");

            if (settings.phoneNumbers && settings.phoneNumbers.trim() !== "") {
                let phones = settings.phoneNumbers.split(',');
                if(modalContactBox) {
                    modalContactBox.innerHTML = `<div style="color: rgba(255,255,255,0.7); margin-bottom: 8px; font-weight:bold;">للتواصل والدعم الفني:</div>` + 
                        phones.map(p => `<a href="https://wa.me/20${p.trim().replace(/^0+/, '')}" target="_blank" style="margin: 0 5px; color: white; text-decoration: none; font-weight: 900; font-size: 16px; letter-spacing: 1px;">${p.trim()}</a>`).join('<span style="color: rgba(255,255,255,0.3);"> | </span>');
                }
            }
        }
    } catch (e) { console.log("Error loading teacher info", e); }
}

window.onload = function() {
    const savedCode = localStorage.getItem("edu_student_code");
    const savedPhone = localStorage.getItem("edu_parent_phone");
    
    loadTeacherInfoInitial(); 
    setDailyMotivation(); // تشغيل الرسالة التحفيزية

    if (savedCode && savedPhone) {
        document.getElementById("studentCode").value = savedCode;
        document.getElementById("parentPhone").value = savedPhone;
        window.fetchStudentData(true); 
    }
};      

// ==========================================
// 🌟 2. دالة الدخول (التحقق وتلوين المنصة)
// ==========================================
window.fetchStudentData = async function(isAutoLogin = false) {
    const code = document.getElementById("studentCode").value.trim();
    const phone = document.getElementById("parentPhone").value.trim();
    const errorMsg = document.getElementById("error-msg");
    const btn = document.getElementById('login-btn-action');
    
    if (!code || !phone || !globalTeacherId) {
        if(!isAutoLogin) { errorMsg.style.display = "block"; errorMsg.innerText = "تأكد من إدخال البيانات كاملة!"; }
        return;
    }

    errorMsg.style.display = "none";
    if(btn && !isAutoLogin) {
        btn.innerHTML = `جاري الدخول... ⏳`;
        btn.disabled = true;
    }

    try {
        let licRes = await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/data/settings.json`, {cache: 'no-store'});
        let licData = await licRes.json();
        
        if (licData) {
            let isExpired = false;
            if (licData.activatedAt) {
                let activationDate = new Date(licData.activatedAt);
                let expirationDate = new Date(activationDate);
                if (licData.durationDays) expirationDate.setDate(expirationDate.getDate() + parseInt(licData.durationDays));
                else if (licData.durationMonths) expirationDate.setMonth(expirationDate.getMonth() + parseInt(licData.durationMonths));
                if (licData.durationMonths != 99 && new Date() > expirationDate) isExpired = true;
            }

            if (licData.status === 'suspended' || isExpired) {
                errorMsg.style.display = "block"; errorMsg.innerText = "عفواً، المنصة متوقفة حالياً. يرجى مراجعة إدارة السنتر!";
                if(btn) { btn.innerHTML = "تسجيل الدخول 🚀"; btn.disabled = false; }
                if(isAutoLogin) { localStorage.removeItem("edu_student_code"); localStorage.removeItem("edu_parent_phone"); }
                return; 
            }
        }

        let res = await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/data.json`, {cache: 'no-store'});
        let data = await res.json() || {};

        let safeStudents = Array.isArray(data.students) ? data.students : Object.values(data.students || {}).filter(i => i !== null);
        let safeGroups = Array.isArray(data.groups) ? data.groups : Object.values(data.groups || {}).filter(i => i !== null);
        let safeClassSessions = Array.isArray(data.classSessions) ? data.classSessions : Object.values(data.classSessions || {}).filter(i => i !== null);
        let safeExams = Array.isArray(data.exams) ? data.exams : Object.values(data.exams || {}).filter(i => i !== null);
        let safeHomeworks = Array.isArray(data.homeworks) ? data.homeworks : Object.values(data.homeworks || {}).filter(i => i !== null);

        window.allClassSessions = safeClassSessions;

        let lecRes = await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/lectures.json`, {cache: 'no-store'});
        let foldRes = await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/lectureFolders.json`, {cache: 'no-store'});
        let foldersData = await foldRes.json() || {};
        window.allFolders = Array.isArray(foldersData) ? foldersData.filter(f => f !== null) : Object.values(foldersData).filter(f => f !== null);
        let lecturesData = await lecRes.json() || {};
        
        if (Array.isArray(lecturesData)) window.allLectures = lecturesData.filter(l => l !== null).reverse();
        else window.allLectures = Object.values(lecturesData).filter(l => l !== null).reverse();

        if (safeStudents.length === 0) {
            errorMsg.style.display = "block"; errorMsg.innerText = "لا يوجد طلاب مسجلين!";
            if(btn) { btn.innerHTML = "تسجيل الدخول 🚀"; btn.disabled = false; }
            return;
        }

        let studentIndex = safeStudents.findIndex(s => s && String(s.code) === String(code) && String(s.parentPhone) === String(phone));
        if (studentIndex === -1) {
            errorMsg.style.display = "block"; errorMsg.innerText = "البيانات غير مسجلة!";
            if(btn) { btn.innerHTML = "تسجيل الدخول 🚀"; btn.disabled = false; }
            return;
        }
        
        currentStudent = safeStudents[studentIndex];
        window.currentStudentIndex = studentIndex;
        
        if (currentStudent.purchasedCourses) currentStudent.purchasedCourses = Array.isArray(currentStudent.purchasedCourses) ? currentStudent.purchasedCourses : Object.values(currentStudent.purchasedCourses);
        else currentStudent.purchasedCourses = [];

        let studentGroupObj = safeGroups.find(g => typeof g === 'object' && g.name === currentStudent.group);
        currentStudent.level = (studentGroupObj && studentGroupObj.level) ? studentGroupObj.level : (currentStudent.level || "غير محدد");

        if (currentStudent.level === "غير محدد") {
            let gName = currentStudent.group || "";
            if (gName.includes("1ث") || gName.includes("الأول")) currentStudent.level = "الصف الأول الثانوي";
            else if (gName.includes("2ث") || gName.includes("الثاني")) currentStudent.level = "الصف الثاني الثانوي";
            else if (gName.includes("3ث") || gName.includes("الثالث")) currentStudent.level = "الصف الثالث الثانوي";
        }

        applyDynamicTheme(currentStudent.level);

        localStorage.setItem("edu_student_code", code);
        localStorage.setItem("edu_parent_phone", phone);
        localStorage.setItem("edu_teacher_id", globalTeacherId);

        allOnlineExams = Array.isArray(data.onlineExams) ? data.onlineExams.filter(e => e !== null) : Object.values(data.onlineExams || {}).filter(e => e !== null);
        window.studentCode = code;

        // تعبئة كارت الطالب
        document.getElementById("top-name").innerText = currentStudent.name;
        document.getElementById("top-group").innerText = currentStudent.group;
        
        let cName = document.getElementById("card-student-name"); if(cName) cName.innerText = currentStudent.name;
        let cLevel = document.getElementById("card-student-level"); if(cLevel) cLevel.innerText = currentStudent.level;
        let cGroup = document.getElementById("card-student-group-name"); if(cGroup) cGroup.innerText = currentStudent.group;
        let cCodeNum = document.getElementById("card-student-code-num"); if(cCodeNum) cCodeNum.innerText = code;
        let cPoints = document.getElementById("card-behavior-points"); if(cPoints) cPoints.innerText = currentStudent.behaviorPoints || 0;

        if (typeof JsBarcode !== 'undefined' && document.getElementById("digitalIdBarcode")) {
            JsBarcode("#digitalIdBarcode", currentStudent.code, { format: "CODE128", lineColor: "#0f172a", width: 2, height: 45, displayValue: false });
        }

        let balance = currentStudent.walletBalance || 0;
        document.getElementById("top-balance").innerText = balance;
        if(document.getElementById("walletBalanceDisplay")) document.getElementById("walletBalanceDisplay").innerText = balance;
        if(document.getElementById("wallet-page-balance")) document.getElementById("wallet-page-balance").innerHTML = `${balance} <span style="font-size: 24px; color: rgba(255,255,255,0.7);">ج.م</span>`;

        // حسابات الخطط والحضور
        let totalItems = 0; let completedItems = 0; let missingLectures = 0; let missingExams = 0;
        try {
            let subRes = await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/onlineSubmissions.json`, {cache: 'no-store'});
            let allSubs = await subRes.json() || {};
            let myExams = allOnlineExams.filter(e => e && (e.status === "open" || e.status === "closed") && (Array.isArray(e.group) ? e.group.includes(currentStudent.group) || e.group.includes("all") : e.group === currentStudent.group || e.group === "all"));
            totalItems += myExams.length;
            myExams.forEach(e => { if (allSubs[e.id] && (allSubs[e.id][currentStudent.code] || allSubs[e.id][currentStudent.phone])) completedItems++; else if (e.status === "open") missingExams++; });

            let myLectures = window.allLectures.filter(l => {
                if (!l) return false;
                let levelMatch = l.level === "all" || l.level === currentStudent.level;
                let trackMatch = !l.track || l.track === 'all' || l.track === (currentStudent.track || 'عام');
                return levelMatch && trackMatch;
            });
            totalItems += myLectures.length;
            let trackRes = await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/course_tracking.json`, {cache: 'no-store'});
            let allTracks = await trackRes.json() || {};
            myLectures.forEach(l => { let hasWatched = allTracks[l.id] && allTracks[l.id][currentStudent.phone]; if (hasWatched) completedItems++; else missingLectures++; });

            let percent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 100;
            if(document.getElementById("tracker-bar")) document.getElementById("tracker-bar").style.width = percent + "%";
            if(document.getElementById("tracker-percentage")) document.getElementById("tracker-percentage").innerText = percent + "%";
            if(document.getElementById("tracker-text")) document.getElementById("tracker-text").innerText = percent === 100 ? "🎉 ممتاز! لقد أتممت خطتك الدراسية!" : "📈 خطة المذاكرة:";
            let reminder = "";
            if (missingLectures > 0) reminder += `🎬 متبقي (${missingLectures}) محاضرة. `;
            if (missingExams > 0) reminder += `📝 متبقي (${missingExams}) امتحان. `;
            if(document.getElementById("tracker-reminder")) document.getElementById("tracker-reminder").innerText = reminder || "🎯 واصل تقدمك!";
        } catch(err) {}

        let attHtml = `<tr><th>التاريخ</th><th>الموضوع</th><th>حالة الحضور</th></tr>`;
        let hasAtt = false;
        safeClassSessions.filter(s => s && s.group === currentStudent.group).reverse().forEach(s => {
            hasAtt = true;
            let stat = (s.attendance || {})[currentStudent.code] || (s.attendance || {})[currentStudent.phone];
            let badge = '<span style="color:var(--text-muted); font-weight:bold;">لم يسجل</span>';
            
            if (stat === 'present') badge = `<span class="badge badge-present">حاضر ✓</span>`;
            else if (stat === 'late') badge = `<span class="badge" style="background:#fef3c7; color:#d97706;">متأخر ⏳</span>`;
            else if (stat === 'absent') badge = `<span class="badge badge-absent">غائب ✗</span>`;
            else if (typeof stat === 'object' && stat.status === 'makeup') badge = `<span style="color:#2563eb; font-weight:900; background:rgba(37,99,235,0.1); padding:4px 10px; border-radius:8px;">💻 تعويض سنتر</span>`;
            else if (typeof stat === 'object' && stat.status === 'platform_makeup') badge = `<span style="color:#a855f7; font-weight:900; background:rgba(168, 85, 247, 0.1); padding:4px 10px; border-radius:8px;">💻 تعويض منصة</span>`;
            
            attHtml += `<tr><td>${s.date}</td><td>${s.topic || 'حصة عادية'}</td><td>${badge}</td></tr>`;
        });
        if(!hasAtt) attHtml += `<tr><td colspan="3" style="text-align:center; padding: 30px; font-weight:bold;">لا توجد حصص مسجلة.</td></tr>`;
        document.getElementById("attendance-details").innerHTML = attHtml;

        let exHtml = `<tr><th>التاريخ</th><th>اسم التقييم</th><th>الدرجة التي حصلت عليها</th></tr>`;
        let hasEx = false;
        safeExams.concat(safeHomeworks).filter(e => e && e.group === currentStudent.group).sort((a,b)=> new Date(b.date) - new Date(a.date)).forEach(e => {
            hasEx = true;
            let grade = (e.grades || {})[currentStudent.code] !== undefined ? (e.grades || {})[currentStudent.code] : (e.grades || {})[currentStudent.phone];
            let text = grade !== undefined ? `<span style="font-weight:900; color:var(--primary); font-size:16px;">${grade} <span style="color:var(--text-muted); font-size:13px;">من ${e.maxScore}</span></span>` : `<span style="color:var(--text-muted); font-weight:bold;">لم يتم الرصد</span>`;
            exHtml += `<tr><td>${e.date}</td><td>${e.name}</td><td>${text}</td></tr>`;
        });
        if(!hasEx) exHtml += `<tr><td colspan="3" style="text-align:center; padding: 30px; font-weight:bold;">لا توجد تقييمات.</td></tr>`;
        document.getElementById("exams-details").innerHTML = exHtml;

        window.fetchStudentNotifications();
        if(typeof window.loadStudentStore === "function") window.loadStudentStore();
        if(typeof window.loadForumQuestions === "function") window.loadForumQuestions();
        window.showOnlineExams(true); 
        window.renderStudentLectures(); 

        document.getElementById("landing-page").style.display = "none";
        document.getElementById("auth-modal").classList.remove('active');
        document.getElementById("app-layout").style.display = "block";

    } catch (e) {
        errorMsg.style.display = "block"; errorMsg.innerText = "خطأ في الاتصال بالسيرفر! يرجى التأكد من البيانات أو الإنترنت.";
        if(btn) { btn.innerHTML = "تسجيل الدخول 🚀"; btn.disabled = false; }
    }
};

window.logoutStudent = function() {
    localStorage.removeItem("edu_student_code");
    localStorage.removeItem("edu_parent_phone");
    localStorage.removeItem("edu_teacher_id");
    location.reload(); 
};

window.switchTab = function(tabId, fromHistory = false) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    let targetTab = document.getElementById(tabId);
    if(targetTab) targetTab.classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(nav => {
        if (nav.getAttribute('onclick') && nav.getAttribute('onclick').includes(tabId)) {
            nav.classList.add('active');
        }
    });

    if (!fromHistory && !window.isHistoryNavigating) {
        history.pushState({ type: 'tab', id: tabId }, '', `#${tabId}`);
    }
};

// ==========================================
// 🚀 دالة إنشاء الحساب (أونلاين فقط)
// ==========================================
window.submitRegistration = async function() {
    globalTeacherId = "ElSenior_System_Master";
    
    let studentData = {
        name: document.getElementById("regName").value.trim(),
        track: document.getElementById("regTrackGroup") && document.getElementById("regTrackGroup").style.display !== 'none' ? document.getElementById("regTrack").value : "عام",
        phone: document.getElementById("regPhone").value.trim() || "0",
        parentPhone: document.getElementById("regParentPhone").value.trim() || "0",
        level: document.getElementById("regLevel").value,
        gender: "غير محدد",
        timestamp: new Date().toISOString(),
        regType: "online",
        gov: document.getElementById("regGov").value.trim(),
        school: document.getElementById("regSchool").value.trim(),
        behaviorPoints: 0
    };

    if (!studentData.name || studentData.phone === "0" || studentData.parentPhone === "0") {
        if(typeof window.showToast === 'function') window.showToast("يرجى ملء الاسم وأرقام الهواتف بشكل صحيح!", "error");
        else alert("يرجى ملء الاسم وأرقام الهواتف بشكل صحيح!");
        return;
    }

    let btn = document.getElementById("submitRegBtn");
    let msgEl = document.getElementById("regMsg");
    btn.innerText = "جاري الإرسال... ⏳"; btn.disabled = true;

    try {
        let targetGroup = "أونلاين - " + studentData.level;
        studentData.group = targetGroup; 

        let res = await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/data/students.json`, {cache: 'no-store'});
        let studentsArray = await res.json() || [];
        studentsArray = Array.isArray(studentsArray) ? studentsArray : Object.values(studentsArray).filter(s => s !== null);
        
        let duplicate = studentsArray.find(s => 
            (studentData.phone !== "0" && s.phone === studentData.phone) || 
            (studentData.parentPhone !== "0" && s.parentPhone === studentData.parentPhone) || 
            (s.name.trim() === studentData.name.trim())
        );

        if (duplicate) {
            msgEl.style.color = "var(--danger)";
            msgEl.innerText = "❌ مسجل مسبقاً! استخدم 'نسيت كود الطالب' لاسترجاع الكود.";
            btn.innerText = 'إنشاء حساب أونلاين 🚀'; 
            btn.disabled = false;
            return; 
        }

        let baseNum = 0;
        if (studentData.level.includes("الأول")) baseNum = 1000;
        else if (studentData.level.includes("الثاني")) baseNum = 2000;
        else if (studentData.level.includes("الثالث")) baseNum = 3000;

        let lastNum = baseNum;
        for (let i = studentsArray.length - 1; i >= 0; i--) {
            let s = studentsArray[i];
            if (s.code && String(s.code).startsWith("O-") && s.level === studentData.level) {
                let num = parseInt(String(s.code).split("-")[1], 10);
                if (!isNaN(num)) { lastNum = num; break; }
            }
        }

        studentData.code = "O-" + (lastNum + 1).toString();
        studentsArray.push(studentData);

        await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/data/students.json`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(studentsArray)
        });

        let centersRes = await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/data/centers.json`);
        let centersArray = await centersRes.json() || ["السنتر الرئيسي"];
        if (!centersArray.includes("أونلاين")) {
            centersArray.push("أونلاين");
            await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/data/centers.json`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(centersArray)
            });
        }

        let groupsRes = await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/data/groups.json`);
        let groupsArray = await groupsRes.json() || [];
        groupsArray = Array.isArray(groupsArray) ? groupsArray : Object.values(groupsArray).filter(g => g !== null);

        let existingGroupIndex = groupsArray.findIndex(g => g.name === targetGroup);
        let needGroupUpdate = false;

        if (existingGroupIndex === -1) {
            groupsArray.push({ name: targetGroup, level: studentData.level, payType: "session", price: 0, center: "أونلاين" });
            needGroupUpdate = true;
        } else if (groupsArray[existingGroupIndex].center !== "أونلاين") {
            groupsArray[existingGroupIndex].center = "أونلاين";
            needGroupUpdate = true;
        }

        if (needGroupUpdate) {
            await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/data/groups.json`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(groupsArray)
            });
        }

        document.getElementById('auth-modal').classList.remove('active');
        document.getElementById('newOnlineCodeDisplay').innerText = studentData.code;
        document.getElementById('successOnlineModal').style.display = 'flex';
        
        document.getElementById("studentCode").value = studentData.code;
        document.getElementById("parentPhone").value = studentData.parentPhone;

    } catch(e) {
        msgEl.style.color = "var(--danger)";
        msgEl.innerText = "❌ حدث خطأ أثناء الاتصال بالإنترنت!";
    }
    btn.innerText = 'إنشاء حساب أونلاين 🚀';
    btn.disabled = false;
};

window.retrieveStudentCode = async function() {
    let phone = document.getElementById("forgotPhoneInput").value.trim();
    let msgEl = document.getElementById("forgotMsg");
    let btn = document.getElementById("retrieveCodeBtn");
    
    if(!phone || phone === "0" || phone.length < 10) {
        msgEl.style.display = "block"; msgEl.style.color = "var(--danger)";
        msgEl.innerText = "يرجى إدخال رقم الهاتف بشكل صحيح!"; return;
    }

    btn.innerText = "جاري البحث... ⏳"; btn.disabled = true; msgEl.style.display = "none";

    try {
        let res = await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/data/students.json`);
        let studentsArray = await res.json() || [];
        studentsArray = Array.isArray(studentsArray) ? studentsArray : Object.values(studentsArray).filter(s => s !== null);

        let foundStudent = studentsArray.find(s => s && (s.parentPhone === phone || s.phone === phone));

        msgEl.style.display = "block";
        if(foundStudent) {
            msgEl.style.color = "var(--success)";
            msgEl.innerHTML = `✅ تم العثور على حسابك!<br>الاسم: <strong>${foundStudent.name}</strong><br>الكود: <span style="font-size: 24px; color: var(--primary);">${foundStudent.code}</span>`;
        } else {
            msgEl.style.color = "var(--danger)";
            msgEl.innerText = "❌ لم يتم العثور على أي طالب بهذا الرقم!";
        }
    } catch(e) {
        msgEl.style.display = "block"; msgEl.style.color = "var(--danger)"; msgEl.innerText = "❌ خطأ في الاتصال بالإنترنت!";
    }
    btn.innerText = "البحث عن الكود 🔍"; btn.disabled = false;
};

window.fetchStudentNotifications = async function() {
    try {
        let notifRes = await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/notifications.json`);
        let notifsData = await notifRes.json() || {};
        let notifsList = Object.values(notifsData).filter(n => {
            if (!n || !n.target) return false;
            if (n.target === 'all' || n.target === currentStudent.phone || n.target === currentStudent.group || n.target === currentStudent.level) return true;
            return false;
        }).reverse();
        let readNotifs = JSON.parse(localStorage.getItem(`read_notifs_${currentStudent.code}`)) || [];
        let unreadCount = 0; let notifHtml = "";
        notifsList.forEach(n => {
            let isRead = readNotifs.includes(n.id);
            if (!isRead) unreadCount++;
            notifHtml += `
            <div style="background: ${isRead ? 'var(--card-bg)' : '#eff6ff'}; padding: 12px 15px; border-radius: 8px; border-right: 4px solid ${isRead ? 'var(--text-muted)' : 'var(--primary)'}; margin-bottom: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); border: 1px solid var(--border); border-right-width: 4px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 5px;">
                    <h5 style="margin: 0; color: var(--text-main); font-size: 14px; font-weight: bold;">${n.title}</h5>
                    ${!isRead ? '<span style="width: 8px; height: 8px; background: var(--primary); border-radius: 50%;"></span>' : ''}
                </div>
                <p style="margin: 0 0 5px 0; font-size: 13px; color: var(--text-muted); line-height: 1.5;">${n.message}</p>
                <span style="font-size: 10px; color: #94a3b8; display: block; text-align: left;">🕒 ${n.date || ''}</span>
            </div>`;
        });
        window.currentLoadedNotifsIds = notifsList.map(n => n.id);
        let notifListContainer = document.getElementById("notif-list");
        let notifBadge = document.getElementById("notif-badge");
        if(notifsList.length > 0) {
            if(notifListContainer) notifListContainer.innerHTML = notifHtml;
            if(notifBadge) {
                if (unreadCount > 0) { notifBadge.style.display = "inline-block"; notifBadge.innerText = unreadCount; }
                else { notifBadge.style.display = "none"; }
            }
        } else {
            if(notifListContainer) notifListContainer.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding: 15px; font-size: 13px; font-weight:bold;">لا توجد إشعارات حالياً 📭</div>`;
            if(notifBadge) notifBadge.style.display = "none";
        }
    } catch(e) {}
};

window.toggleNotifications = function() {
    let dropdown = document.getElementById("notif-dropdown");
    if (!dropdown) return;
    let isOpening = dropdown.style.display === "none";
    dropdown.style.display = isOpening ? "block" : "none";
    if (isOpening && window.currentLoadedNotifsIds && window.currentLoadedNotifsIds.length > 0 && currentStudent) {
        let readNotifs = JSON.parse(localStorage.getItem(`read_notifs_${currentStudent.code}`)) || [];
        window.currentLoadedNotifsIds.forEach(id => { if (!readNotifs.includes(id)) readNotifs.push(id); });
        localStorage.setItem(`read_notifs_${currentStudent.code}`, JSON.stringify(readNotifs));
        let notifBadge = document.getElementById("notif-badge");
        if (notifBadge) notifBadge.style.display = "none";
    }
};

window.loadStudentStore = async function() {
    let container = document.getElementById("student-store-grid");
    if(!container) return;
    container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:20px; font-weight:bold;">جاري تحميل المتجر... ⏳</div>`;
    try {
        let res = await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/store/items.json`);
        let items = await res.json() || {};
        let itemsArray = Object.values(items).reverse();
        if(itemsArray.length === 0) {
            container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:var(--text-muted); padding:30px; font-weight:bold;">لا توجد عناصر.</div>`;
        } else {
            container.innerHTML = itemsArray.map(item => {
                let priceText = item.currency === 'points' ? `${item.price} نقطة` : `${item.price} ج.م`;
                let icon = item.currency === 'points' ? '⭐' : '💰';
                return `
                <div style="background:var(--bg-color); border-radius:20px; overflow:hidden; border:1px solid var(--border); display:flex; flex-direction:column; box-shadow: 0 5px 15px rgba(0,0,0,0.03);">
                    <img src="${item.image}" style="width:100%; height:160px; object-fit:cover; border-bottom:4px solid var(--primary);">
                    <div style="padding:20px; display:flex; flex-direction:column; flex:1;">
                        <h4 style="margin:0 0 8px 0; font-size:18px;">${item.name}</h4>
                        <div style="margin-top:auto; background:white; padding:12px; border-radius:12px; text-align:center; margin-bottom:15px; border: 1px dashed var(--border);">
                            <span style="font-weight:900; color:var(--primary); font-size:16px;">${icon} ${priceText}</span>
                        </div>
                        <button class="btn" style="border-radius:12px; font-size:15px;" onclick="window.purchaseStoreItem('${item.id}', '${item.name}', ${item.price}, '${item.currency}')">استبدال / شراء 🎁</button>
                    </div>
                </div>`;
            }).join('');
        }
        window.loadStudentOrdersHistory();
    } catch(e) {}
};

window.loadStudentOrdersHistory = async function() {
    let tbody = document.getElementById("student-orders-tbody");
    if(!tbody) return;
    try {
        let res = await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/store/logs.json`);
        let logs = await res.json() || {};
        let myOrders = Object.values(logs).filter(log => log.studentCode === currentStudent.code).reverse();
        if(myOrders.length === 0) { tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; font-weight:bold;">لم تقم بأي عمليات شراء.</td></tr>`; return; }
        tbody.innerHTML = myOrders.map(o => `<tr><td>${o.date}</td><td><strong style="color:var(--primary);">${o.itemName}</strong></td><td><span class="badge" style="background:#f1f5f9; color:var(--text-muted);">${o.currency==='points'?'نقاط ⭐':'محفظة 💰'}</span></td><td><span class="badge badge-present">نجاح ✅</span></td></tr>`).join('');
    } catch(e) {}
};

window.purchaseStoreItem = async function(itemId, itemName, price, currency) {
    price = parseFloat(price);
    let confirmMsg = currency === 'points' ? `تأكيد خصم ${price} نقطة لاستبدال (${itemName})؟` : `تأكيد خصم ${price} ج.م لشراء (${itemName})؟`;

    if (currency === 'points' && (currentStudent.behaviorPoints || 0) < price) return window.showToast("رصيد نقاطك لا يكفي.", "error");
    if (currency !== 'points' && (currentStudent.walletBalance || 0) < price) return window.showToast("رصيد محفظتك لا يكفي.", "error");

    if (!confirm(confirmMsg)) return; 

    let btn = event.currentTarget; let origText = btn.innerText;
    btn.innerText = "جاري التنفيذ... ⏳"; btn.disabled = true;

    try {
        if (currency === 'points') currentStudent.behaviorPoints -= price;
        else currentStudent.walletBalance -= price;

        let updates = currency === 'points' ? { behaviorPoints: currentStudent.behaviorPoints } : { walletBalance: currentStudent.walletBalance };
        
        await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/data/students/${window.currentStudentIndex}.json`, { 
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) 
        });

        let orderId = "order_" + Date.now();
        await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/store/logs/${orderId}.json`, { 
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ id: orderId, date: new Date().toLocaleString('ar-EG'), studentName: currentStudent.name, studentCode: currentStudent.code, itemName: itemName, price: price, currency: currency }) 
        });

        window.showToast("تمت العملية بنجاح! سيتم تسليمك العنصر 🎁", "success");
        if(window.confetti) confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } }); // 🎉 احتفال

        if (currency === 'points') {
            let pointsEl = document.getElementById("card-behavior-points"); if (pointsEl) pointsEl.innerText = currentStudent.behaviorPoints;
        } else {
            document.getElementById("top-balance").innerText = currentStudent.walletBalance;
            let pageBalance = document.getElementById("wallet-page-balance");
            if(pageBalance) pageBalance.innerHTML = `${currentStudent.walletBalance} <span style="font-size: 24px; color: rgba(255,255,255,0.7);">ج.م</span>`;
        }

        window.loadStudentOrdersHistory();
    } catch (e) { window.showToast("خطأ أثناء العملية!", "error"); } 
    finally { btn.innerText = origText; btn.disabled = false; }
};

window.submitForumQuestion = async function() {
    let text = document.getElementById("forumQuestionInput").value.trim();
    if(!text) return window.showToast("اكتب السؤال أولاً!", "error");
    let questionObj = { id: "q_" + Date.now(), studentName: currentStudent.name, studentGroup: currentStudent.group, studentPhone: currentStudent.phone, questionText: text, replyText: "", date: new Date().toLocaleDateString('ar-EG') };
    try {
        await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/forum/${questionObj.id}.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(questionObj) });
        document.getElementById("forumQuestionInput").value = ""; window.showToast("تم نشر سؤالك! 🚀", "success"); window.loadForumQuestions();
    } catch(e) {}
};

window.loadForumQuestions = async function() {
    let container = document.getElementById("forum-questions-list");
    if(!container) return;
    try {
        let res = await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/forum.json`);
        let data = await res.json() || {}; container.innerHTML = "";
        let myGroupQuestions = Object.values(data).filter(q => q && q.studentGroup === currentStudent.group).reverse();
        if(myGroupQuestions.length === 0) { container.innerHTML = `<div style="text-align:center; padding:20px; font-weight:bold; color:var(--text-muted);">لا توجد نقاشات.</div>`; return; }
        container.innerHTML = myGroupQuestions.map(q => `
            <div style="background:#f8fafc; padding:20px; border-radius:16px; border:1px solid var(--border); box-shadow:0 2px 4px rgba(0,0,0,0.02);">
                <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:bold; color:var(--text-muted); margin-bottom:10px;"><span>👤 ${q.studentName}</span><span>🕒 ${q.date}</span></div>
                <p style="font-weight:900; color:var(--secondary); font-size:16px;">❓ السؤال: ${q.questionText}</p>
                <div style="background:white; padding:15px; border-radius:12px; border-right:4px solid ${q.replyText ? 'var(--success)' : 'var(--danger)'}; border-left:1px solid var(--border); border-top:1px solid var(--border); border-bottom:1px solid var(--border);">
                    ${q.replyText ? `💡 <strong>الرد:</strong> <span style="color:#059669; font-weight:bold;">${q.replyText}</span>` : '⏳ <em>بانتظار الرد...</em>'}
                </div>
            </div>`).join('');
    } catch(e) {}
};

window.showOnlineExams = async function(isRenderOnly = false, fromHistory = false) {
    if(!isRenderOnly) {
        document.getElementById("app-layout").style.display = "none";
        document.getElementById("online-exams-list-screen").style.display = "block";
    }
    const container = document.getElementById("available-exams-container");
    container.innerHTML = `<div style="text-align:center; font-weight:bold; grid-column:1/-1;">جاري جلب الامتحانات...</div>`;
    try {
        let subRes = await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/onlineSubmissions.json`, {cache: 'no-store'});
        let allSubs = await subRes.json() || {};
        window.studentSubmissions = allSubs;
        let myExams = allOnlineExams.filter(e => {
            if(!e || (e.status !== "open" && e.status !== "closed")) return false;
            let groupArray = Array.isArray(e.group) ? e.group : [e.group];
            return (groupArray.includes(currentStudent.group) || groupArray.includes("all")) && (!e.track || e.track === 'all' || e.track === (currentStudent.track || 'عام'));
        });
        container.innerHTML = "";
        if (myExams.length === 0) { container.innerHTML = `<div style="text-align:center; grid-column:1/-1; font-weight:bold;">لا توجد امتحانات.</div>`; return; }
        
        myExams.forEach(exam => {
            let isSubmitted = (allSubs[exam.id] || {})[currentStudent.code] || (allSubs[exam.id] || {})[currentStudent.phone];
            let actionBtn = isSubmitted ? `<button class="btn" style="background: var(--secondary);" onclick="window.reviewExam('${exam.id}')">عرض الإجابات</button>` : `<button class="btn" style="background:linear-gradient(45deg, #10b981, #059669);" onclick="window.startExam('${exam.id}')">بدء الامتحان 🚀</button>`;
            if(exam.status === "closed" && !isSubmitted) actionBtn = `<div style="color:var(--danger); font-weight:900;">انتهى الوقت</div>`;
            container.innerHTML += `<div style="background: white; padding: 20px; border-radius: 16px; border: 1px solid var(--border);"><h3 style="margin:0 0 10px 0; color:var(--secondary); font-size:20px; font-weight:900;">${exam.title}</h3><span style="font-weight:bold; color:var(--text-muted); font-size:14px; display:block; margin-bottom: 15px;">⏱️ المدة: ${exam.duration} دقيقة</span>${actionBtn}</div>`;
        });
    } catch(e) {}
    
    if (!isRenderOnly && !fromHistory && !window.isHistoryNavigating) {
        history.pushState({ type: 'screen', id: 'online-exams' }, '', '#online-exams');
    }
};

window.currentSlideIndex = 0;
window.navigateSlide = function(step) {
    let slides = document.querySelectorAll('.q-slide');
    if(slides.length === 0) return;
    slides[window.currentSlideIndex].style.display = 'none';
    window.currentSlideIndex += step;
    slides[window.currentSlideIndex].style.display = 'block';
    slides[window.currentSlideIndex].style.animation = 'none';
    setTimeout(() => slides[window.currentSlideIndex].style.animation = 'fadeInUp 0.4s ease forwards', 10);
};

window.startExam = function(examId) {
    currentExam = allOnlineExams.find(e => e.id === examId); 
    if(!currentExam) return;
    if(!confirm(`هل أنت مستعد؟ المدة: ${currentExam.duration} دقيقة.`)) return;
    
    document.getElementById("online-exams-list-screen").style.display = "none"; 
    document.getElementById("active-exam-screen").style.display = "block";
    document.getElementById("active-exam-title").innerText = currentExam.title;

    const container = document.getElementById("exam-questions-render"); container.innerHTML = "";
    window.currentSlideIndex = 0;
    
    currentExam.questions.forEach((q, index) => {
        let displayStyle = index === 0 ? "block" : "none";
        let qHtml = `<div class="q-slide" id="slide_${index}" style="display: ${displayStyle}; background: white; padding: 35px 30px; border-radius: 24px; box-shadow: 0 15px 35px rgba(0,0,0,0.05); border: 1px solid var(--border); margin-bottom: 20px;">`;
        qHtml += `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px dashed var(--border); padding-bottom: 15px; direction: rtl;"><span style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; padding: 8px 20px; border-radius: 12px; font-weight: 900; font-size: 16px;">🎯 ${q.points} درجات</span><span style="color: var(--text-muted); font-weight: 900; background: var(--bg-color); padding: 8px 15px; border-radius: 12px;">السؤال ${index + 1} من ${currentExam.questions.length}</span></div>`;
        qHtml += `<div style="direction: ltr; text-align: left; font-family: 'Segoe UI', Tahoma, sans-serif;"><h3 style="color: var(--secondary); font-size: 24px; line-height: 1.6; margin: 0 0 25px 0;">${index + 1}. ${q.text}</h3>`;

        if (q.type === 'mcq') { 
            qHtml += `<div style="display: flex; flex-direction: column; gap: 12px;">`; 
            q.options.forEach((opt, optIndex) => { 
                qHtml += `<label style="display: flex; align-items: center; gap: 15px; background: var(--bg-color); border: 2px solid var(--border); padding: 15px 20px; border-radius: 15px; cursor: pointer; transition: 0.3s; font-size: 18px; font-weight: 600;" onclick="document.querySelectorAll('input[name=ans_${q.id}]').forEach(inp => {inp.parentElement.style.borderColor='var(--border)'; inp.parentElement.style.background='var(--bg-color)';}); this.style.borderColor='var(--primary)'; this.style.background='rgba(14, 165, 233, 0.05)';"><input type="radio" name="ans_${q.id}" value="${optIndex}" style="width: 22px; height: 22px; accent-color: var(--primary);"> <span style="flex: 1;">${opt}</span></label>`; 
            }); 
            qHtml += `</div>`; 
        } 
        else if (q.type === 'tf') { qHtml += `<div style="display: flex; gap: 20px;"><label style="flex: 1; text-align: center; border: 2px solid #10b981; padding: 20px; border-radius: 15px; cursor: pointer; font-size: 22px; font-weight: bold; color: #10b981;" onclick="document.querySelectorAll('input[name=ans_${q.id}]').forEach(i=>{i.parentElement.style.background='transparent'; i.parentElement.style.opacity='0.5'}); this.style.background='rgba(16, 185, 129, 0.15)'; this.style.opacity='1';"><input type="radio" name="ans_${q.id}" value="true" style="display:none;"> ✔️ True</label><label style="flex: 1; text-align: center; border: 2px solid #ef4444; padding: 20px; border-radius: 15px; cursor: pointer; font-size: 22px; font-weight: bold; color: #ef4444;" onclick="document.querySelectorAll('input[name=ans_${q.id}]').forEach(i=>{i.parentElement.style.background='transparent'; i.parentElement.style.opacity='0.5'}); this.style.background='rgba(239, 68, 68, 0.15)'; this.style.opacity='1';"><input type="radio" name="ans_${q.id}" value="false" style="display:none;"> ❌ False</label></div>`; } 
        else if (q.type === 'blank') { qHtml += `<input type="text" id="ans_${q.id}" class="custom-input" placeholder="Type your answer here..." style="font-size: 18px; padding: 15px; width: 100%; direction: ltr;">`; } 
        else if (q.type === 'essay') { qHtml += `<textarea id="ans_${q.id}" class="custom-input" rows="5" placeholder="Write your answer..." style="font-size: 18px; padding: 15px; width: 100%; direction: ltr; resize: vertical;"></textarea>`; }
        qHtml += `</div><div style="display: flex; justify-content: space-between; margin-top: 35px; border-top: 1px solid var(--border); padding-top: 25px; direction: rtl;"><button class="btn btn-secondary" style="width: auto; padding: 12px 30px;" onclick="window.navigateSlide(-1)">السابق</button>${index === currentExam.questions.length - 1 ? `<button class="btn slide-submit-btn" style="width: auto; background: var(--success);" onclick="window.submitOnlineExam()">تسليم نهائياً ✅</button>` : `<button class="btn" style="width: auto; padding: 12px 40px;" onclick="window.navigateSlide(1)">التالي ⬅️️</button>`}</div></div>`;
        container.innerHTML += qHtml;
    });
    
    let timeInSeconds = currentExam.duration * 60; const timerDisplay = document.getElementById('exam-timer');
    examTimerInterval = setInterval(() => { 
        let m = Math.floor(timeInSeconds / 60), s = timeInSeconds % 60; 
        timerDisplay.innerText = `${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`; 
        if(timeInSeconds <= 60) timerDisplay.parentElement.style.background = "var(--danger)";
        if (timeInSeconds <= 0) { clearInterval(examTimerInterval); window.submitOnlineExam(true); } 
        timeInSeconds--; 
    }, 1000);
};

window.submitOnlineExam = async function(isTimeOut = false) {
    if (!isTimeOut && !confirm("متأكد من تسليم الامتحان؟")) return; 
    clearInterval(examTimerInterval);
    
    let totalScore = 0; let studentAnswers = {};
    currentExam.questions.forEach(q => {
        let qScore = 0;
        if (q.type === 'mcq') { let selected = document.querySelector(`input[name="ans_${q.id}"]:checked`); let ansVal = selected ? parseInt(selected.value) : -1; studentAnswers[q.id] = ansVal; if (ansVal === q.correctAnswerIndex) qScore = q.points; } 
        else if (q.type === 'tf') { let selected = document.querySelector(`input[name="ans_${q.id}"]:checked`); let ansVal = selected ? selected.value : ""; studentAnswers[q.id] = ansVal; if (ansVal === String(q.correctAnswerTF || q.correctAnswer)) qScore = q.points; } 
        else if (q.type === 'blank') { let ansVal = document.getElementById(`ans_${q.id}`).value.trim(); studentAnswers[q.id] = ansVal; if (ansVal.toLowerCase() === (q.correctAnswerText || "").toLowerCase()) qScore = q.points; } 
        else if (q.type === 'essay') { studentAnswers[q.id] = document.getElementById(`ans_${q.id}`).value.trim(); }
        totalScore += qScore;
    });
    
    try {
        document.querySelectorAll(".slide-submit-btn, #submitExamBtn").forEach(btn => { if(btn) { btn.innerText = "جاري الحفظ..."; btn.disabled = true; }});
        await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/onlineSubmissions/${currentExam.id}/${currentStudent.code}.json`, { 
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ score: totalScore, maxScore: currentExam.totalScore, answers: studentAnswers, timestamp: new Date().toISOString() }) 
        });
        
        window.showToast("تم التسليم بنجاح! 🎯", "success"); 
        if(window.confetti) confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'] }); // 🎉 احتفال تسليم الامتحان
        
        document.getElementById("active-exam-screen").style.display = "none"; 
        window.showOnlineExams(); 
    } catch (e) { window.showToast("خطأ بالاتصال!", "error"); } 
    finally { document.querySelectorAll(".slide-submit-btn").forEach(btn => { if(btn) btn.disabled = false; }); }
};

window.reviewExam = function(examId) {
    let exam = allOnlineExams.find(e => e.id === examId); 
    let sub = (window.studentSubmissions[examId] || {})[currentStudent.code] || (window.studentSubmissions[examId] || {})[currentStudent.phone];
    if(!exam || !sub) return;

    document.getElementById("online-exams-list-screen").style.display = "none"; 
    document.getElementById("review-exam-screen").style.display = "block";
    document.getElementById("review-exam-title").innerText = exam.title; 
    document.getElementById("review-exam-score").innerText = sub.score; 
    document.getElementById("review-exam-total").innerText = exam.totalScore;
    
    let container = document.getElementById("review-questions-render"); container.innerHTML = "";
    
    exam.questions.forEach((q, index) => {
        let studentAns = sub.answers[q.id]; let qScore = 0; let ansHtml = "";
        
        if (q.type === 'mcq') {
            qScore = (studentAns === q.correctAnswerIndex) ? q.points : 0;
            ansHtml = `<div style="display: flex; flex-direction: column; gap: 10px;">`;
            q.options.forEach((opt, optIndex) => {
                let bg = "var(--bg-color)"; let border = "var(--border)"; let icon = "";
                if (optIndex === q.correctAnswerIndex) { bg = "#d1fae5"; border = "#10b981"; icon = "✅"; }
                else if (optIndex === studentAns) { bg = "#fee2e2"; border = "#ef4444"; icon = "❌"; }
                ansHtml += `<div style="background:${bg}; border: 2px solid ${border}; padding: 12px 15px; border-radius: 12px; font-weight: bold; display: flex; justify-content: space-between;"><span>${opt}</span> <span>${icon}</span></div>`;
            });
            ansHtml += `</div>`;
        } else if (q.type === 'tf') {
            let isCorrect = (String(studentAns) === String(q.correctAnswerTF || q.correctAnswer)); qScore = isCorrect ? q.points : 0;
            ansHtml = `<div style="background: ${isCorrect?'#d1fae5':'#fee2e2'}; padding:15px; border-radius:12px; font-weight:bold; border:2px solid ${isCorrect?'#10b981':'#ef4444'}; font-size: 18px;">Your Answer: ${studentAns==='true'?'True ✔️':'False ❌'} <br> Correct: ${(q.correctAnswerTF || q.correctAnswer)==='true'?'True ✔️':'False ❌'}</div>`;
        } else {
            qScore = (sub.manualGrades && sub.manualGrades[q.id] !== undefined) ? sub.manualGrades[q.id] : (studentAns === q.correctAnswerText ? q.points : 0);
            ansHtml = `<div style="background:var(--bg-color); padding:15px; border-radius:12px; border:2px solid var(--border); font-weight:bold; font-size: 16px;">Your Answer: <span style="color: var(--primary);">${studentAns || 'No Answer'}</span></div>`;
        }

        container.innerHTML += `
        <div style="background: white; padding: 30px; border-radius: 20px; border: 1px solid var(--border); margin-bottom: 20px; text-align: left; direction: ltr;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px dashed var(--border); padding-bottom: 15px; direction: rtl;">
                <span style="background: ${qScore > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; color: ${qScore > 0 ? '#10b981' : '#ef4444'}; padding: 8px 20px; border-radius: 12px; font-weight: 900; border: 1px solid ${qScore > 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'};">الدرجة: ${qScore} / ${q.points}</span>
            </div>
            <h3 style="color: var(--secondary); font-size: 22px; margin: 0 0 20px 0;">${q.text}</h3>
            ${ansHtml}
        </div>`;
    });
};

// 🛠️ حل باج التايمر اللي مكنش بيقف
window.closeReviewScreen = function() { 
    clearInterval(examTimerInterval); 
    document.getElementById("review-exam-screen").style.display = "none"; 
    document.getElementById("online-exams-list-screen").style.display = "block"; 
};

window.backToDashboard = function(fromHistory = false) {
    clearInterval(examTimerInterval); 
    document.getElementById("online-exams-list-screen").style.display = "none"; 
    document.getElementById("app-layout").style.display = "block";
    if (!fromHistory && !window.isHistoryNavigating) {
        history.pushState({ type: 'tab', id: 'tab-exams' }, '', '#tab-exams');
    }
};

window.openCoursePlayer = function(courseId, startVideoIndex = 0, fromHistory = false) {
    let course = window.allLectures.find(l => l.id === courseId);
    if(!course) return;

    document.body.classList.add("no-select");
    document.getElementById("app-layout").style.display = "none";
    document.getElementById("protected-course-screen").style.display = "flex";
    document.getElementById("player-course-title").innerText = `${course.title}`;
    document.getElementById("video-watermark").innerHTML = `${currentStudent.name} <br> ${currentStudent.phone}`;

    let vids = course.videos || [];
    if(vids.length === 0 && course.url) vids.push({title: "المحاضرة كاملة", url: course.url});

    let playlistHtml = `<h4 style="color:#94a3b8; margin:0 0 20px 0; font-size: 14px;">محتويات الكورس</h4>`;
    vids.forEach((v, idx) => {
        let safeTitle = v.title.replace(/'/g, "\\'");
        let isActive = idx === startVideoIndex;
        let bgStyle = isActive ? "background: rgba(59, 130, 246, 0.15); border-right: 4px solid #3b82f6; color: #3b82f6;" : "background: transparent; color: #94a3b8;";
        playlistHtml += `<div class="playlist-item" data-index="${idx}" style="${bgStyle} padding:15px; border-radius:8px; margin-bottom:8px; cursor:pointer;" onclick="window.playCourseVideo('${v.url}', '${safeTitle}', '${course.id}', ${idx}, this)"><span class="vid-icon">${isActive ? '▶️' : '📺'}</span> <span style="font-size: 15px; font-weight:bold;">${v.title}</span></div>`;
    });
    
    document.getElementById("player-playlist").innerHTML = playlistHtml;

    if(vids.length > startVideoIndex) {
        window.playCourseVideo(vids[startVideoIndex].url, vids[startVideoIndex].title, course.id, startVideoIndex, document.querySelector('.playlist-item[data-index="'+startVideoIndex+'"]'));
    }
    window.recordPlatformMakeup(courseId);

    if (!fromHistory && !window.isHistoryNavigating) {
        history.pushState({ type: 'player', id: courseId }, '', `#player-${courseId}`);
    }
};

window.playCourseVideo = async function(url, videoTitle, courseId, videoIndex, element = null) {
    let course = window.allLectures.find(l => l.id === courseId); if (!course) return;
    let maxViews = parseInt(course.maxViews) || 0; 
    let usedKey = currentStudent.code;
    let resCode = await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/course_tracking/${courseId}/${usedKey}/${videoIndex}.json`);
    let data = await resCode.json() || { views: 0 };
    
    if (maxViews > 0 && data.views >= (maxViews + (parseInt(data.extraViews) || 0))) {
        return window.showToast("🚫 لقد استنفدت العدد المسموح لمشاهدة هذا الفيديو.", "error"); 
    }

    if (element) {
        document.querySelectorAll('.playlist-item').forEach(item => { item.style.background = 'transparent'; item.style.color = '#94a3b8'; item.style.borderRight = 'none'; item.querySelector('.vid-icon').innerText = '📺'; });
        element.style.background = 'rgba(59, 130, 246, 0.15)'; element.style.color = '#3b82f6'; element.style.borderRight = '4px solid #3b82f6'; element.querySelector('.vid-icon').innerText = '▶️';
    }

    let embedUrl = url;
    try {
        let parsedUrl = new URL(url);
        if (parsedUrl.hostname.includes('youtube.com') || parsedUrl.hostname.includes('youtu.be')) {
            let videoId = parsedUrl.searchParams.get('v') || parsedUrl.pathname.substring(1);
            if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId.split('&')[0]}?rel=0&modestbranding=1`;
        }
    } catch(e) { if(url.includes("watch?v=")) embedUrl = url.replace("watch?v=", "embed/"); else if(url.includes("youtu.be/")) embedUrl = url.replace("youtu.be/", "youtube.com/embed/"); }
    
    document.getElementById("video-iframe").src = embedUrl;

    let now = new Date();
    await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/course_tracking/${courseId}/${usedKey}/${videoIndex}.json`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ videoTitle: videoTitle, views: data.views + 1, lastSeen: now.toLocaleDateString('ar-EG') + " | " + now.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: 'numeric', hour12: true }), extraViews: (parseInt(data.extraViews) || 0) })
    });
};

window.closeCoursePlayer = function(fromHistory = false) {
    document.getElementById("video-iframe").src = ""; 
    document.body.classList.remove("no-select");
    document.getElementById("protected-course-screen").style.display = "none";
    document.getElementById("app-layout").style.display = "block";
    if (!fromHistory && !window.isHistoryNavigating) history.pushState({ type: 'tab', id: 'tab-lectures' }, '', '#tab-lectures');
};

window.toggleCustomFullscreen = function() {
    let player = document.getElementById("video-wrapper"); let btn = document.getElementById("custom-fs-btn");
    if (!document.fullscreenElement) { (player.requestFullscreen || player.webkitRequestFullscreen || player.msRequestFullscreen).call(player); btn.innerText = "🗗 تصغير الشاشة"; } 
    else { (document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen).call(document); btn.innerText = "⛶ تكبير الشاشة"; }
};

window.renderStudentLectures = function() {
    let list = document.getElementById("studentLecturesList"); if(!list || !currentStudent) return; list.innerHTML = "";
    if(!window.studentLecPath.level) window.studentLecPath.level = currentStudent.level;

    let myLectures = (window.allLectures || []).filter(l => l && (l.level === "all" || l.level === currentStudent.level) && (!l.track || l.track === 'all' || l.track === (currentStudent.track || 'عام')));
    let folders = window.allFolders || [];

    if (!window.studentLecPath.term) {
        let terms = [...new Set(folders.filter(f => f.type === 'term' && f.parentLevel === currentStudent.level).map(f => f.name))];
        if (terms.length === 0) return list.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; font-weight:bold; color:var(--text-muted); background: var(--card-bg); border-radius: 20px; border: 2px dashed var(--border);">لا توجد كورسات متاحة لصفك حالياً.</div>`;
        list.innerHTML = terms.map(termName => {
            let termFolder = folders.find(f => f.type === 'term' && f.name === termName && f.parentLevel === currentStudent.level);
            let termPrice = termFolder ? (parseFloat(termFolder.price) || 0) : 0;
            let isPurchased = currentStudent.purchasedCourses && termFolder && currentStudent.purchasedCourses.includes(termFolder.id);
            let priceBadge = isPurchased ? `<span style="background: rgba(16,185,129,0.2); color: #10b981; padding: 4px 10px; border-radius: 8px; font-size: 13px; font-weight: 900; margin-top: 10px; display: inline-block;">✅ باقة مفعلة</span>` : (termPrice > 0 ? `<span style="background: rgba(255,255,255,0.2); color: #fff; padding: 4px 10px; border-radius: 8px; font-size: 13px; font-weight: 900; margin-top: 10px; display: inline-block;">باقة كاملة: ${termPrice} ج.م</span>` : '');
            return `<div onclick="window.studentLecPath.term = '${termName}'; window.renderStudentLectures();" style="background: linear-gradient(135deg, var(--primary), var(--secondary)); border-radius: 20px; padding: 30px; text-align: center; cursor: pointer; color: white; transition: 0.3s; box-shadow: 0 10px 20px rgba(0,0,0,0.1);" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'"><span style="font-size: 50px; display: block; margin-bottom: 10px;">📚</span><h3 style="margin: 0; font-size: 22px; font-weight: 900;">${termName}</h3>${priceBadge}</div>`;
        }).join('');
        return;
    }

    if (!window.studentLecPath.month) {
        let months = [...new Set(folders.filter(f => f.type === 'month' && f.parentTerm === window.studentLecPath.term && f.parentLevel === currentStudent.level).map(f => f.name))].sort();
        let termFolder = folders.find(f => f.type === 'term' && f.name === window.studentLecPath.term && f.parentLevel === currentStudent.level);
        let termPrice = termFolder ? (parseFloat(termFolder.price) || 0) : 0;
        let isTermPurchased = currentStudent.purchasedCourses && termFolder && currentStudent.purchasedCourses.includes(termFolder.id);

        let termBundleBanner = termPrice > 0 ? (isTermPurchased ? `<div style="grid-column: 1/-1; background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 20px 25px; border-radius: 18px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;"><div><h3 style="margin:0; font-size:18px;">💎 باقة (${window.studentLecPath.term}) مفعلة بالكامل</h3></div><span style="background: white; color: #059669; padding: 8px 15px; border-radius: 12px; font-weight: 900;">مشترك ✅</span></div>` : `<div style="grid-column: 1/-1; background: linear-gradient(135deg, #1e293b, #0f172a); color: white; padding: 20px 25px; border-radius: 18px; display: flex; justify-content: space-between; align-items: center; border: 2px dashed #f59e0b; margin-bottom: 10px; flex-wrap:wrap; gap:15px;"><div><h3 style="margin:0; font-size:18px; color: #f59e0b;">🎁 وفر واشترك في (${window.studentLecPath.term}) بالكامل</h3><p style="margin:5px 0 0 0; font-size:13px; color: #cbd5e1;">بـ <strong>${termPrice} ج.م</strong> فقط!</p></div><button class="btn" style="width:auto; background: linear-gradient(45deg, #f59e0b, #d97706); padding: 10px 25px; border-radius: 12px;" onclick="window.purchaseFolder('${termFolder.id}', '${termFolder.name}', ${termPrice})">شراء باقة الترم 💳</button></div>`) : "";

        list.innerHTML = `<div style="grid-column: 1/-1; margin-bottom: 15px; background: white; padding: 15px 25px; border-radius: 18px; border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;"><div style="display: flex; align-items: center; gap: 10px;"><span style="font-size: 24px;">📂</span><h3 style="margin: 0; color: var(--secondary); font-size: 20px; font-weight: 900;">${window.studentLecPath.term}</h3></div><button onclick="window.studentLecPath.term = null; window.renderStudentLectures();" class="btn" style="width:auto; background: #f1f5f9; color: var(--secondary); border: 1px solid var(--border);">🔙 العودة للأترام</button></div>${termBundleBanner}`;
        
        list.innerHTML += months.map(monthName => {
            let monthFolder = folders.find(f => f.type === 'month' && f.name === monthName && f.parentTerm === window.studentLecPath.term && f.parentLevel === currentStudent.level);
            let monthPrice = monthFolder ? (parseFloat(monthFolder.price) || 0) : 0;
            let isMonthPurchased = currentStudent.purchasedCourses && monthFolder && currentStudent.purchasedCourses.includes(monthFolder.id);
            let priceBadge = (isTermPurchased || isMonthPurchased) ? `<span style="background: rgba(16,185,129,0.1); color: #10b981; padding: 4px 10px; border-radius: 8px; font-size: 13px; font-weight: 900; margin-top: 10px; display: inline-block;">✅ باقة مفعلة</span>` : (monthPrice > 0 ? `<span style="background: rgba(245,158,11,0.1); color: #f59e0b; padding: 4px 10px; border-radius: 8px; font-size: 13px; font-weight: 900; margin-top: 10px; display: inline-block;">باقة كاملة: ${monthPrice} ج.م</span>` : '');
            return `<div onclick="window.studentLecPath.month = '${monthName}'; window.renderStudentLectures();" style="background: white; border-radius: 20px; padding: 30px; text-align: center; cursor: pointer; border: 2px solid var(--border); transition: 0.3s; box-shadow: 0 5px 15px rgba(0,0,0,0.05);" onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border)'"><span style="font-size: 50px; display: block; margin-bottom: 10px;">📆</span><h3 style="margin: 0; font-size: 22px; font-weight: 900; color: var(--secondary);">${monthName}</h3>${priceBadge}</div>`;
        }).join('');
        return;
    }

    // 3. المحاضرات
    let finalLectures = myLectures.filter(l => (l.term || 'الترم الأول') === window.studentLecPath.term && (l.month || 'شهر غير محدد') === window.studentLecPath.month).sort((a, b) => (parseInt(String(b.id).replace('lec_', '')) || 0) - (parseInt(String(a.id).replace('lec_', '')) || 0));
    
    let termFolder = folders.find(f => f.type === 'term' && f.name === window.studentLecPath.term && f.parentLevel === currentStudent.level);
    let isTermPurchased = currentStudent.purchasedCourses && termFolder && currentStudent.purchasedCourses.includes(termFolder.id);
    let monthFolder = folders.find(f => f.type === 'month' && f.name === window.studentLecPath.month && f.parentTerm === window.studentLecPath.term && f.parentLevel === currentStudent.level);
    let monthPrice = monthFolder ? (parseFloat(monthFolder.price) || 0) : 0;
    let isMonthPurchased = currentStudent.purchasedCourses && monthFolder && currentStudent.purchasedCourses.includes(monthFolder.id);

    let monthBundleBanner = (monthPrice > 0 && !isTermPurchased) ? (isMonthPurchased ? `<div style="grid-column: 1/-1; background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 20px 25px; border-radius: 18px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;"><div><h3 style="margin:0; font-size:18px;">💎 باقة (${window.studentLecPath.month}) مفعلة بالكامل</h3></div><span style="background: white; color: #059669; padding: 8px 15px; border-radius: 12px; font-weight: 900;">مشترك ✅</span></div>` : `<div style="grid-column: 1/-1; background: linear-gradient(135deg, #1e293b, #0f172a); color: white; padding: 20px 25px; border-radius: 18px; display: flex; justify-content: space-between; align-items: center; border: 2px dashed #10b981; margin-bottom: 10px; flex-wrap:wrap; gap:15px;"><div><h3 style="margin:0; font-size:18px; color: #10b981;">🎁 اشترك في (${window.studentLecPath.month}) بالكامل</h3><p style="margin:5px 0 0 0; font-size:13px; color: #cbd5e1;">بـ <strong>${monthPrice} ج.م</strong>!</p></div><button class="btn" style="width:auto; background: linear-gradient(45deg, #10b981, #059669); padding: 10px 25px; border-radius: 12px;" onclick="window.purchaseFolder('${monthFolder.id}', '${monthFolder.name}', ${monthPrice})">شراء باقة الشهر 💳</button></div>`) : "";

    list.innerHTML = `<div style="grid-column: 1/-1; margin-bottom: 15px; background: white; padding: 15px 25px; border-radius: 18px; border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;"><div style="font-size: 16px; font-weight: 900; color: var(--secondary);"><span style="font-size: 22px;">📂</span> <span style="color: var(--text-muted); cursor: pointer;" onclick="window.studentLecPath.term = null; window.studentLecPath.month = null; window.renderStudentLectures();">${window.studentLecPath.term}</span> / <span style="color: var(--primary);">${window.studentLecPath.month}</span></div><button onclick="window.studentLecPath.month = null; window.renderStudentLectures();" class="btn" style="width:auto; background: #f1f5f9; color: var(--secondary); border: 1px solid var(--border);">🔙 العودة للشهور</button></div>${monthBundleBanner}`;

    if (finalLectures.length === 0) list.innerHTML += `<div style="grid-column: 1/-1; text-align:center; padding: 40px; font-weight:bold; color:var(--text-muted); background: white; border-radius: 20px; border: 2px dashed var(--border);">لا توجد محاضرات في هذا الشهر.</div>`;

    finalLectures.forEach(lec => {
        let maxViews = parseInt(lec.maxViews) || 0;
        let badgeHtml = `<div style="display:flex; gap:5px; flex-wrap:wrap; justify-content:flex-end;"><span style="background: rgba(245, 158, 11, 0.95); color: white; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 900;">👁️ ${maxViews > 0 ? maxViews : 'غير محدود'}</span><span style="background: rgba(14, 165, 233, 0.95); color: white; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 900;">${(lec.videos||[]).length} محاضرات</span></div>`;
        list.innerHTML += `<div style="background: var(--card-bg); border-radius: 20px; overflow: hidden; border: 1px solid var(--border); box-shadow: 0 10px 20px rgba(0,0,0,0.04); display: flex; flex-direction: column;"><div style="position: relative;"><img src="${lec.image}" style="width: 100%; height: 200px; object-fit: cover; border-bottom: 4px solid var(--primary);"><div style="position: absolute; top: 15px; right: 15px; width: calc(100% - 30px);">${badgeHtml}</div></div><div style="padding: 25px; display: flex; flex-direction: column; flex: 1;"><h3 style="margin: 0 0 15px 0; color: var(--secondary); font-size: 20px; font-weight: 900;">${lec.title}</h3><p style="margin: 0 0 25px 0; font-size: 14px; color: var(--text-muted); font-weight: bold;">${lec.desc || 'لا توجد تفاصيل إضافية.'}</p><div style="margin-top: auto;"><button class="btn" style="background: #3b82f6; padding: 15px; border-radius: 12px;" onclick="window.openStudentCourseDetails('${lec.id}')">▶️ تصفح محتوى الكورس</button></div></div></div>`;
    });
};

const originalFetch = window.fetch;
window.fetch = async function(resource, config) {
    if (typeof resource === 'string' && resource.includes('firebasedatabase.app')) { config = config || {}; config.cache = 'no-store'; }
    return originalFetch(resource, config);
};

window.purchaseWholeCourse = async function(courseId, price, courseTitle) {
    if(!confirm(`تأكيد خصم ${price} ج.م لشراء كورس (${courseTitle})؟`)) return;
    if((currentStudent.walletBalance || 0) < price) return window.showToast("رصيد محفظتك لا يكفي!", "error");
    
    let btn = event.currentTarget; let origText = btn.innerText; btn.innerText = "جاري الشراء... ⏳"; btn.disabled = true;

    try {
        currentStudent.walletBalance -= price;
        if (!currentStudent.purchasedCourses) currentStudent.purchasedCourses = [];
        if (!Array.isArray(currentStudent.purchasedCourses)) currentStudent.purchasedCourses = Object.values(currentStudent.purchasedCourses);
        currentStudent.purchasedCourses = currentStudent.purchasedCourses.filter(Boolean);
        if(!currentStudent.purchasedCourses.includes(courseId)) currentStudent.purchasedCourses.push(courseId);

        await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/data/students/${window.currentStudentIndex}/walletBalance.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(currentStudent.walletBalance) });
        await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/data/students/${window.currentStudentIndex}/purchasedCourses.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(currentStudent.purchasedCourses) });

        window.showToast("تم شراء الكورس بنجاح! 🎉", "success");
        if(window.confetti) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); // 🎉 احتفال
        
        document.getElementById("top-balance").innerText = currentStudent.walletBalance;
        let pageBalance = document.getElementById("wallet-page-balance");
        if(pageBalance) pageBalance.innerHTML = `${currentStudent.walletBalance} <span style="font-size: 24px; color: rgba(255,255,255,0.7);">ج.م</span>`;

        window.openStudentCourseDetails(courseId);
    } catch(e) { window.showToast("خطأ أثناء الشراء!", "error"); } 
    finally { btn.innerText = origText; btn.disabled = false; }
};

window.purchaseFolder = async function(folderId, folderName, price) {
    if(!confirm(`تأكيد خصم ${price} ج.م لشراء باقة (${folderName})؟`)) return;
    if((currentStudent.walletBalance || 0) < price) return window.showToast("رصيد محفظتك لا يكفي!", "error");
    
    let btn = event.currentTarget; let origText = btn.innerText; btn.innerText = "جاري الشراء... ⏳"; btn.disabled = true;

    try {
        currentStudent.walletBalance -= price;
        if (!currentStudent.purchasedCourses) currentStudent.purchasedCourses = [];
        if (!Array.isArray(currentStudent.purchasedCourses)) currentStudent.purchasedCourses = Object.values(currentStudent.purchasedCourses);
        currentStudent.purchasedCourses = currentStudent.purchasedCourses.filter(Boolean);
        if(!currentStudent.purchasedCourses.includes(folderId)) currentStudent.purchasedCourses.push(folderId);

        await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/data/students/${window.currentStudentIndex}/walletBalance.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(currentStudent.walletBalance) });
        await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/data/students/${window.currentStudentIndex}/purchasedCourses.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(currentStudent.purchasedCourses) });
        
        window.showToast(`🎉 مبروك! تم شراء باقة (${folderName}) بنجاح!`, "success");
        if(window.confetti) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); // 🎉 احتفال
        
        document.getElementById("top-balance").innerText = currentStudent.walletBalance;
        let pageBalance = document.getElementById("wallet-page-balance");
        if(pageBalance) pageBalance.innerHTML = `${currentStudent.walletBalance} <span style="font-size: 24px; color: rgba(255,255,255,0.7);">ج.م</span>`;

        window.renderStudentLectures();
    } catch(e) { window.showToast("خطأ أثناء الشراء!", "error"); } 
    finally { btn.innerText = origText; btn.disabled = false; }
};

window.openStudentCourseDetails = async function(courseId) {
    let course = window.allLectures.find(l => l.id === courseId); if(!course) return;

    let allSubs = {}; let safeExams = [];
    try {
        let subRes = await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/onlineSubmissions.json`, {cache: 'no-store'});
        window.studentSubmissions = await subRes.json() || {}; allSubs = window.studentSubmissions;
        let examsRes = await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/data/onlineExams.json`, {cache: 'no-store'});
        let fetchedExams = await examsRes.json() || []; safeExams = Array.isArray(fetchedExams) ? fetchedExams : Object.values(fetchedExams).filter(e => e !== null);
    } catch(e) {}

    document.getElementById("detailsCourseTitle").innerText = course.title;
    document.getElementById("detailsCourseImage").src = course.image || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=600&auto=format&fit=crop';
    document.getElementById("detailsCourseDesc").innerText = course.desc || "تفاصيل المحاضرات بالأسفل.";

    let vids = course.videos || []; let playlistHtml = "";
    
    let termFolder = (window.allFolders || []).find(f => f.type === 'term' && f.name === course.term && f.parentLevel === currentStudent.level);
    let monthFolder = (window.allFolders || []).find(f => f.type === 'month' && f.name === course.month && f.parentTerm === course.term && f.parentLevel === currentStudent.level);

    let isFolderBundleActive = currentStudent.purchasedCourses && (currentStudent.purchasedCourses.includes(courseId) || (termFolder && currentStudent.purchasedCourses.includes(termFolder.id)) || (monthFolder && currentStudent.purchasedCourses.includes(monthFolder.id)));

    let cType = course.type || 'free'; let coursePrice = course.price || 0; let isCourseFree = (cType === 'free');

    let attendedAny = false; let linkedArr = [];
    if (course.linkedSessions && Array.isArray(course.linkedSessions)) linkedArr = linkedArr.concat(course.linkedSessions);
    vids.forEach(v => { if (v.linkedSession) linkedArr.push(v.linkedSession); });

    if (linkedArr.length > 0 && window.allClassSessions) {
        for (let sessId of linkedArr) {
            let sessionObj = window.allClassSessions.find(s => String(s.id) === String(sessId));
            if (sessionObj && sessionObj.attendance) {
                let stat = sessionObj.attendance[currentStudent.code] || sessionObj.attendance[currentStudent.phone];
                if (stat === 'present' || stat === 'late' || (typeof stat === 'object' && stat.status === 'makeup')) { attendedAny = true; break; }
            }
        }
    }

    let isCourseUnlocked = isCourseFree || isFolderBundleActive || attendedAny;

    if (!isCourseUnlocked && coursePrice > 0) {
        playlistHtml += `<div style="background: linear-gradient(135deg, #1e293b, #0f172a); padding: 20px; border-radius: 12px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; border: 2px dashed var(--primary);"><h4 style="color: white; margin: 0;">🛒 شراء الكورس بالكامل</h4><button class="btn" style="width: auto;" onclick="window.purchaseWholeCourse('${course.id}', ${coursePrice}, '${course.title.replace(/'/g, "\\'")}')">شراء بـ ${coursePrice} ج.م</button></div>`;
    }

    vids.forEach((v, idx) => {
        let cExam = course.requiredExam || v.requiredExam; let isLockedByExam = false; let requiredExamObj = null;
        if (cExam && !attendedAny) {
            requiredExamObj = safeExams.find(e => e.id === cExam); 
            if (requiredExamObj && !(allSubs[cExam] && (allSubs[cExam][currentStudent.code] || allSubs[cExam][currentStudent.phone]))) isLockedByExam = true;
        }

        if (isLockedByExam && requiredExamObj) {
            if (isCourseUnlocked) playlistHtml += `<div style="background: var(--bg-color); padding: 15px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border); margin-bottom: 10px;"><span style="font-weight: 900; color: var(--secondary);">🔒 ${v.title} <br><span style="font-size:13px; color:#f59e0b;">مغلق بامتحان: (${requiredExamObj.title})</span></span><button class="btn" style="background: #f59e0b; width: auto;" onclick="document.getElementById('studentCourseDetailsModal').style.display='none'; window.showOnlineExams();">انتقل للامتحان 📝</button></div>`;
            else playlistHtml += `<div style="background: var(--bg-color); padding: 15px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; border: 1px dashed #cbd5e1; margin-bottom: 10px; opacity: 0.6;"><span style="font-weight: 900; color: var(--text-muted);">🔒 ${v.title}</span><button class="btn" style="background: #e2e8f0; color: #94a3b8; width: auto;" disabled>انتقل للامتحان 📝</button></div>`;
        } else if (!isCourseUnlocked) {
            playlistHtml += `<div style="background: var(--bg-color); padding: 15px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border); margin-bottom: 10px; opacity: 0.7;"><span style="font-weight: 900; color: var(--text-muted);">🔒 ${v.title}</span><span style="color: var(--danger); font-size: 12px; font-weight: bold; background: #fee2e2; padding: 4px 10px; border-radius: 6px;">يتطلب الشراء</span></div>`;
        } else {
            playlistHtml += `<div style="background: #f0fdf4; padding: 15px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #10b981; margin-bottom: 10px;"><span style="font-weight: 900; color: #065f46;">▶️ ${v.title}</span><button class="btn" style="background: var(--success); width: auto;" onclick="document.getElementById('studentCourseDetailsModal').style.display='none'; window.openCoursePlayer('${course.id}', ${idx})">تشغيل ▶️</button></div>`;
        }
    });

    document.getElementById("detailsCoursePlaylist").innerHTML = playlistHtml;
    document.getElementById("studentCourseDetailsModal").style.display = "flex";
};

window.redeemCode = async function() {
    const codeInput = document.getElementById("rechargeCodeInput"); const code = codeInput.value.trim();
    if(!code) return window.showToast("أدخل الكود أولاً!", "error");

    let btn = event.currentTarget; let origText = btn.innerText; btn.innerText = "جاري الشحن... ⏳"; btn.disabled = true;

    try {
        let res = await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/chargeCodes/${code}.json`);
        let codeData = await res.json();
        
        if(!codeData || codeData.status === 'used') return window.showToast("الكود غير صحيح أو مستخدم مسبقاً!", "error");

        let amount = parseFloat(codeData.amount);
        await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/chargeCodes/${code}/status.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify("used") });

        currentStudent.walletBalance = (currentStudent.walletBalance || 0) + amount;
        await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/data/students/${window.currentStudentIndex}/walletBalance.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(currentStudent.walletBalance) });

        window.showToast(`تم شحن ${amount} ج.م بنجاح! 🎉`, "success");
        codeInput.value = ""; 
        
        document.getElementById("top-balance").innerText = currentStudent.walletBalance;
        let pageBalance = document.getElementById("wallet-page-balance");
        if(pageBalance) pageBalance.innerHTML = `${currentStudent.walletBalance} <span style="font-size: 24px; color: rgba(255,255,255,0.7);">ج.م</span>`;
        
    } catch (e) { window.showToast("خطأ في الاتصال!", "error"); } 
    finally { btn.innerText = origText; btn.disabled = false; }
};

window.isHistoryNavigating = false;
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (document.getElementById("app-layout").style.display === "block" || document.getElementById("protected-course-screen").style.display === "flex" || document.getElementById("online-exams-list-screen").style.display === "block") {
            let hash = window.location.hash.replace('#', '');
            if (hash && hash !== 'tab-home') {
                if (hash === 'online-exams') window.showOnlineExams(false, true);
                else if (hash.startsWith('player-')) window.openCoursePlayer(hash.replace('player-', ''), 0, true);
                else if (hash.startsWith('tab-')) window.switchTab(hash, true);
            } else {
                history.replaceState({ type: 'tab', id: 'tab-home' }, '', '#tab-home');
                window.switchTab('tab-home', true);
            }
        }
    }, 1500);
});

window.addEventListener('popstate', function(event) {
    window.isHistoryNavigating = true; const state = event.state;
    let detailsModal = document.getElementById('studentCourseDetailsModal'); if(detailsModal) detailsModal.style.display = 'none';
    if (state) {
        if (state.type === 'tab') {
            document.getElementById('online-exams-list-screen').style.display = 'none';
            document.getElementById('active-exam-screen').style.display = 'none';
            document.getElementById('review-exam-screen').style.display = 'none';
            document.getElementById('protected-course-screen').style.display = 'none';
            document.getElementById('app-layout').style.display = 'block';
            window.switchTab(state.id, true);
        } 
        else if (state.type === 'screen' && state.id === 'online-exams') window.showOnlineExams(false, true);
        else if (state.type === 'player') window.openCoursePlayer(state.id, 0, true);
    } else {
        document.getElementById('online-exams-list-screen').style.display = 'none';
        document.getElementById('protected-course-screen').style.display = 'none';
        document.getElementById('app-layout').style.display = 'block';
        window.switchTab('tab-home', true);
    }
    setTimeout(() => { window.isHistoryNavigating = false; }, 100);
});

window.submitManualWalletRequest = async function() {
    let amount = parseFloat(document.getElementById("manualWalletAmount").value);
    let transferNum = document.getElementById("manualWalletNumber").value.trim();
    let imageInput = document.getElementById("manualWalletImage");
    if (!amount || amount <= 0) return alert("يرجى كتابة المبلغ!");
    if (!imageInput.files || imageInput.files.length === 0) return alert("يرجى رفع الإيصال!");

    let btn = event.currentTarget; let origText = btn.innerText; btn.innerText = "جاري الرفع... ⏳"; btn.disabled = true;

    try {
        let imageBase64 = await new Promise((resolve) => {
            let file = imageInput.files[0]; let reader = new FileReader();
            reader.onload = function(e) {
                let img = new Image(); img.onload = function() {
                    let cvs = document.createElement('canvas'); let MAX = 600; let w = img.width; let h = img.height;
                    if (w > h) { if (w > MAX) { h *= MAX/w; w = MAX; } } else { if (h > MAX) { w *= MAX/h; h = MAX; } }
                    cvs.width = w; cvs.height = h; cvs.getContext('2d').drawImage(img, 0, 0, w, h);
                    resolve(cvs.toDataURL('image/jpeg', 0.6));
                }; img.src = e.target.result;
            }; reader.readAsDataURL(file);
        });

        await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/wallet_requests/req_${Date.now()}.json`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentCode: currentStudent.code, studentName: currentStudent.name, amount: amount, transferNumber: transferNum || "بدون رقم", receiptImage: imageBase64, timestamp: new Date().toISOString(), status: "pending" })
        });
        alert("✅ تم إرسال الطلب!"); document.getElementById("manualWalletAmount").value = ""; document.getElementById("manualWalletNumber").value = ""; imageInput.value = "";
    } catch (e) { alert("❌ خطأ أثناء الرفع."); } finally { btn.innerText = origText; btn.disabled = false; }
};

window.updateFileName = function(input) {
    if (input.files && input.files[0]) {
        document.getElementById("uploadFileName").innerText = "✅ تم اختيار الملف: " + input.files[0].name;
        document.getElementById("uploadFileName").style.color = "var(--success)";
    }
};

window.recordPlatformMakeup = async function(courseId) {
    let course = window.allLectures.find(l => l.id === courseId); if (!course) return;
    let linkedArr = [];
    if (course.linkedSessions && Array.isArray(course.linkedSessions)) linkedArr = linkedArr.concat(course.linkedSessions);
    (course.videos || []).forEach(v => { if (v.linkedSession) linkedArr.push(v.linkedSession); });
    
    if (linkedArr.length > 0 && window.allClassSessions) {
        let updates = {}; let hasUpdates = false;
        for (let sessId of linkedArr) {
            let sIdx = window.allClassSessions.findIndex(s => s && String(s.id) === String(sessId));
            if (sIdx > -1) {
                let stat = (window.allClassSessions[sIdx].attendance || {})[currentStudent.code] || (window.allClassSessions[sIdx].attendance || {})[currentStudent.phone];
                if (stat === 'absent' || !stat) {
                    updates[`data/classSessions/${sIdx}/attendance/${currentStudent.code}`] = { status: 'platform_makeup' };
                    if ((window.allClassSessions[sIdx].attendance || {})[currentStudent.phone]) updates[`data/classSessions/${sIdx}/attendance/${currentStudent.phone}`] = null;
                    hasUpdates = true;
                    if(!window.allClassSessions[sIdx].attendance) window.allClassSessions[sIdx].attendance = {};
                    window.allClassSessions[sIdx].attendance[currentStudent.code] = { status: 'platform_makeup' };
                }
            }
        }
        if (hasUpdates) {
            updates[`data/students/${window.currentStudentIndex}/behaviorPoints`] = (currentStudent.behaviorPoints || 0) + 5;
            currentStudent.behaviorPoints = (currentStudent.behaviorPoints || 0) + 5; 
            await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}.json`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
            await fetch(`https://elsenior-alone-default-rtdb.europe-west1.firebasedatabase.app/${globalTeacherId}/syncSignal.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Date.now()) });
            window.showToast("💻 تم تسجيل الحصة كـ (تعويض منصة) بنجاح وإضافة 5 نقاط لتميزك!");
            let ptsEl = document.getElementById("card-behavior-points"); if (ptsEl) ptsEl.innerText = currentStudent.behaviorPoints;
        }
    }
};

window.showToast = function(message, type = 'success') {
    let container = document.getElementById('premium-toast-container');
    if (!container) { container = document.createElement('div'); container.id = 'premium-toast-container'; document.body.appendChild(container); }
    let icon = type === 'success' ? '✅' : '❌';
    const toast = document.createElement('div'); toast.className = `premium-toast toast-${type}`;
    toast.innerHTML = `<div class="premium-toast-content"><div class="toast-icon">${icon}</div><div class="toast-text" style="color:#1e293b; font-weight:bold;">${message}</div></div>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 500); }, 4000);
};