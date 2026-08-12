const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 🔑 مفتاح Google Gemini (سنقوم بإنشائه مجاناً لاحقاً)
const GEMINI_API_KEY = "ضع_مفتاح_جوجل_هنا";

// دالة لجلب معلومات السنتر من Firebase (RAG Pattern)
async function fetchCenterData(clientId) {
    try {
        const response = await fetch(`https://el-senior-system-default-rtdb.europe-west1.firebasedatabase.app/${clientId}.json`);
        return await response.json();
    } catch (e) {
        console.error("خطأ في جلب بيانات السنتر:", e);
        return null;
    }
}

// مسار استقبال الرسائل من سيرفر الواتساب
app.post('/process-message', async (req, res) => {
    const { clientId, phone, text } = req.body;

    if (!clientId || !text) {
        return res.status(400).json({ action: 'error', message: 'Missing data' });
    }

    try {
        // 1. جلب داتا السنتر الحية (المجموعات، الأسعار، الجدول، الطلاب)
        const centerData = await fetchCenterData(clientId);
        
        if (!centerData || !centerData.data) {
            return res.json({ action: 'handoff' });
        }

        const groups = centerData.data.groups || [];
        const settings = centerData.data.settings || {};
        const teacherName = settings.teacherName || "المعلم";

        // 2. صياغة عقل الـ AI (System Prompt)
        const systemPrompt = `أنت مساعد ذكي ولطيف تعمل لصالح منصة "EduTrack" ومركز الأستاذ ${teacherName}.
        مهمتك هي الرد على استفسارات الطلاب وأولياء الأمور باللغة العربية العامية المصرية المهذبة والمختصرة.
        
        معلومات السنتر الحالية التي يجب أن تعتمد عليها فقط:
        - المجموعات وأسعارها: ${JSON.stringify(groups)}
        
        قواعد هامة:
        1. إذا سأل الطالب عن مواعيد المجموعات أو أسعارها، أجب من المعلومات أعلاه فقط.
        2. إذا سأل الطالب عن شيء غير موجود في المعلومات (مثل مشكلة تقنية معقدة، خصم مالي، أو سؤال علمي في المنهج)، يجب أن ترد بكلمة واحدة فقط باللغة الإنجليزية وهي: HANDOFF.
        3. لا تقم بتأليف أي أسعار أو مواعيد من عندك نهائياً.
        
        رسالة الطالب هي: "${text}"`;

        // 3. إرسال الطلب لـ Google Gemini
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }],
                generationConfig: { temperature: 0.3 } // درجة حرارة منخفضة لردود دقيقة غير مؤلفة
            })
        });

        const geminiData = await geminiResponse.json();
        let aiReply = geminiData.candidates[0].content.parts[0].text.trim();

        // 4. تحديد الإجراء بناءً على رد الـ AI
        if (aiReply.includes('HANDOFF')) {
            return res.json({ action: 'handoff' });
        } else {
            return res.json({ action: 'reply', message: aiReply });
        }

    } catch (error) {
        console.error("خطأ في معالجة الـ AI:", error);
        // في حالة حدوث أي خطأ، نحول المحادثة للأسيستنت البشري كإجراء أمان
        return res.json({ action: 'handoff' });
    }
});

// تشغيل سيرفر الـ AI على بورت 4000
app.listen(4000, () => {
    console.log('🤖 AI Server is running on port 4000');
});

process.on('uncaughtException', (err) => console.error('AI Error:', err));
process.on('unhandledRejection', (reason) => console.error('AI Rejection:', reason));