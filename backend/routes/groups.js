const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const User = require('../models/User');
const auth = require('../middleware/auth');
const Notification = require('../models/Notification'); // Notification 모델을 불러옵니다.

// 새 그룹 생성
router.post('/', auth, async (req, res) => {
  try {
    const { name, fridgeId } = req.body;
    
    if (!name || !fridgeId) {
      return res.status(400).json({ message: '그룹 이름과 냉장고 ID가 필요합니다.' });
    }

    const newGroup = new Group({
      name,
      owner: req.user.id,
      members: [req.user.id],
      fridge: fridgeId
    });

    await newGroup.save();

    res.status(201).json({
      message: '그룹이 생성되었습니다.',
      group: {
        id: newGroup._id,
        name: newGroup.name,
        inviteCode: newGroup.inviteCode,
        inviteLink: `${process.env.MOBILE_APP_URL}/join-group/${newGroup.inviteCode}`
      }
    });
  } catch (error) {
    console.error('그룹 생성 오류:', error);
    res.status(500).json({ message: '서버 오류' });
  }
});

// 내 그룹 목록 조회
router.get('/my-groups', auth, async (req, res) => {
  try {
    const myGroups = await Group.find({
      $or: [
        { owner: req.user.id },
        { members: req.user.id }
      ]
    }).populate('owner', 'name email').select('-__v');

    res.status(200).json({
      groups: myGroups.map(group => ({
        id: group._id,
        name: group.name,
        owner: group.owner,
        memberCount: group.members.length,
        inviteCode: group.inviteCode,
        inviteLink: `${process.env.MOBILE_APP_URL}/join-group/${group.inviteCode}`
      }))
    });
  } catch (error) {
    console.error('그룹 목록 조회 오류:', error);
    res.status(500).json({ message: '서버 오류' });
  }
});

// 그룹의 초대 코드 재생성
router.post('/:groupId/regenerate-invite', auth, async (req, res) => {
  try {
    const group = await Group.findOne({ _id: req.params.groupId, owner: req.user.id });
    
    if (!group) {
      return res.status(404).json({ message: '그룹을 찾을 수 없거나 권한이 없습니다.' });
    }

    const newInviteCode = group.generateNewInviteCode();
    await group.save();

    res.status(200).json({
      message: '새로운 초대 코드가 생성되었습니다.',
      inviteCode: newInviteCode,
      inviteLink: `${process.env.MOBILE_APP_URL}/join-group/${newInviteCode}`
    });
  } catch (error) {
    console.error('초대 코드 재생성 오류:', error);
    res.status(500).json({ message: '서버 오류' });
  }
});

// 초대 코드로 그룹 정보 조회
router.get('/by-invite/:inviteCode', auth, async (req, res) => {
  try {
    const group = await Group.findOne({ inviteCode: req.params.inviteCode })
      .populate('owner', 'name email');
    
    if (!group) {
      return res.status(404).json({ message: '유효하지 않은 초대 코드입니다.' });
    }
    
    // 멤버 수 계산
    const memberCount = group.members.length;
    
    // 이미 그룹에 속해 있는지 확인
    const isAlreadyMember = group.members.some(member => 
      member.toString() === req.user.id.toString());
    
    if (isAlreadyMember) {
      return res.status(400).json({ message: '이미 이 그룹의 멤버입니다.' });
    }
    
    res.json({
      groupId: group._id,
      name: group.name,
      memberCount,
      ownerName: group.owner.name
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('서버 오류');
  }
});

// 초대 코드로 그룹에 참여
router.post('/join/:inviteCode', auth, async (req, res) => {
  try {
    const group = await Group.findOne({ inviteCode: req.params.inviteCode });
    
    if (!group) {
      return res.status(404).json({ message: '유효하지 않은 초대 코드입니다.' });
    }
    
    // 이미 그룹에 속해 있는지 확인
    if (group.members.includes(req.user.id)) {
      return res.status(400).json({ message: '이미 이 그룹의 멤버입니다.' });
    }
    
    // 그룹에 사용자 추가
    group.members.push(req.user.id);
    await group.save();
    
    // 알림 생성 (그룹 소유자와 다른 멤버들에게)
    const newNotification = new Notification({
      recipient: group.owner,
      type: 'groupJoin',
      message: `${req.user.name}님이 ${group.name} 그룹에 참여했습니다.`,
      related: {
        userId: req.user.id,
        groupId: group._id
      }
    });
    
    await newNotification.save();
    
    res.json({ 
      success: true, 
      message: '그룹에 성공적으로 참여했습니다.',
      group: {
        id: group._id,
        name: group.name
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('서버 오류');
  }
});

// 그룹 멤버 목록 조회
router.get('/:groupId/members', auth, async (req, res) => {
  try {
    const groupId = req.params.groupId;
    
    // 임시 ID 처리 - 로그인한 실제 사용자 정보 활용
    if (groupId.startsWith('temp-') || !groupId.match(/^[0-9a-fA-F]{24}$/)) {
      // 현재 인증된 사용자 정보 가져오기
      const currentUser = await User.findById(req.user.id).select('name email');
      
      if (!currentUser) {
        return res.status(404).json({ message: '사용자 정보를 찾을 수 없습니다.' });
      }
      
      return res.json({
        groupId: groupId,
        groupName: '내 냉장고 그룹',
        members: [
          {
            _id: currentUser._id,
            name: currentUser.name,
            email: currentUser.email,
            isOwner: true
          }
        ]
      });
    }
    
    // 그룹 존재 여부 확인
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: '그룹을 찾을 수 없습니다.' });
    }
    
    // 사용자가 그룹의 멤버인지 확인
    if (!group.members.includes(req.user.id) && group.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: '이 그룹의 멤버 목록을 볼 권한이 없습니다.' });
    }
    
    // 멤버 정보 가져오기
    const members = await User.find({ _id: { $in: group.members } })
      .select('name email _id');
    
    // 소유자 여부 표시
    const membersWithRole = members.map(member => ({
      _id: member._id,
      name: member.name,
      email: member.email,
      isOwner: group.owner.toString() === member._id.toString()
    }));
    
    res.json({
      groupId: group._id,
      groupName: group.name,
      members: membersWithRole
    });
    
  } catch (error) {
    console.error('그룹 멤버 조회 오류:', error);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;
