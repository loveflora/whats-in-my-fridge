const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// 사용자의 모든 알림 가져오기
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 }) // 최신순 정렬
      .limit(50); // 최대 50개만 가져옴
    
    res.json(notifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('서버 오류');
  }
});

// 알림을 읽음으로 표시
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: '알림을 찾을 수 없습니다.' });
    }
    
    // 본인의 알림만 업데이트할 수 있도록 체크
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: '이 작업을 수행할 권한이 없습니다.' });
    }
    
    notification.read = true;
    await notification.save();
    
    res.json(notification);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('서버 오류');
  }
});

// 모든 알림을 읽음으로 표시
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { $set: { read: true } }
    );
    
    res.json({ message: '모든 알림이 읽음으로 표시되었습니다.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('서버 오류');
  }
});

// 알림 삭제
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: '알림을 찾을 수 없습니다.' });
    }
    
    // 본인의 알림만 삭제할 수 있도록 체크
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: '이 작업을 수행할 권한이 없습니다.' });
    }
    
    await notification.remove();
    
    res.json({ message: '알림이 삭제되었습니다.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('서버 오류');
  }
});

// 읽지 않은 알림 수 가져오기
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.id,
      read: false
    });
    
    res.json({ count });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('서버 오류');
  }
});

module.exports = router;
