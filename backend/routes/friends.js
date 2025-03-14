const express = require('express');
const router = express.Router();
const { sendInvitationEmail } = require('../utils/emailService');

// 친구 초대 API 엔드포인트 (POST /api/friends/invite)
router.post('/invite', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // 로그 추가
    console.log(`Received invitation request for email: ${email}`);

    // 이메일 발송 결과
    const emailResult = await sendInvitationEmail(email);
    console.log('Email sending result:', emailResult);

    // 성공 응답
    // 이메일 발송 성공 여부에 따라 응답 메시지 다르게 처리
    // 이메일 발송 성공 여부는 emailResult.success 값으로 확인
    res.status(200).json({ 
      message: 'Invitation sent successfully',
      emailSent: emailResult.success,
      details: emailResult.success ? 'Email was sent' : 'Email could not be sent, but invitation was recorded'
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
