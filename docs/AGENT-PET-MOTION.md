# Zone pet — 프레임 모션

2026-10-12 · D-097. TO-DO ZONE 내부 캐릭터다. ChatGPT 계정의 펫을 생성·교체하는 작업은 아니다.

## 결과물

- 앱 이미지: `frontend/public/agent/zone-pet-frames.png`
- 2048 × 1024 투명 PNG, 256 × 256 셀, 8열 × 4행, 총 32프레임.
- 재생: `frontend/src/components/AgentPet.tsx`, `AgentPet.module.css`
- [실제 프레임 재생 미리보기](assets/zone-pet-motion.gif): 앱과 같은 프레임·유지 시간을 사용한다. 동작을 비교할 수 있게 인사와 점프를 4초마다 반복하는 영상이며, 앱에서는 클릭/완료 시 한 번 재생한다.

## 동작 설계

| 행 | 동작 | 프레임 1 → 8 | 프레임별 유지 시간(ms) | 앱에서의 동작 |
|---|---|---|---|---|
| 0 | 대기 | 기본 → 들숨 → 눈꺼풀 내려옴 → 눈 감음 → 반쯤 뜸 → 뜨고 날숨 → 이완 → 기본 | 2200,160,100,110,100,180,240,300 | 편안한 대기와 눈 깜빡임 반복 |
| 1 | 인사 | 기본 → 팔 접어 올림 → 손 높임 → 바깥으로 흔듦 → 웃으며 안으로 → 다시 바깥으로 → 팔 내림 → 기본 | 120,120,130,110,150,130,150,200 | 캐릭터 클릭 시 1회, 이후 기본 동작 복귀 |
| 2 | 생각 | 기본 → 손을 턱으로 → 궁금한 표정 → 고개 기울임 → 눈 감음 → 다른 쪽 응시 → 손 내리는 중간 포즈 → 기본 | 350,180,280,650,110,500,160,450 | 입력 중 관심 표현. AI 처리 중이라는 의미는 아님 |
| 3 | 완료 | 기본 → 웅크림 → 발을 밀고 팔 올림 → 공중 → 웃으며 정점 → 하강 → 착지하며 웅크림 → 만족한 기본 | 100,160,100,110,180,100,130,300 | 예시 DONE 후 헤더와 완료 영역에서 1회, 대기로 복귀 |

## 제작 방식과 프롬프트

내장 이미지 생성 도구로 기존 `zone-pet.png`를 정체성 참고 이미지로 첨부해 포즈를 생성했다. 코드로 얼굴이나 신체를 그리거나 기존 PNG를 회전·왜곡해 포즈를 만들지 않았다. 생성된 픽셀을 추출하고, 동작별 공통 배율·기준선으로 256px 셀에 정렬한 뒤 투명 PNG로 패킹했다. 점프의 실제 공중 높이는 유지한다. 인사에서 손이 바뀌는 한 프레임은 이미지 생성 도구로 수정한 포즈를 사용하고, 생각 동작의 손 내리기는 같은 손을 쓰는 중간 포즈를 역으로 사용했다.

초기 생성 프롬프트:

> Production animation sprite atlas for Todo Zone. Reference: the existing sage-green clay pet, cream belly, glossy olive eyes, two little ears, two short feet. Transparent alpha, 8 columns × 4 rows, 32 full-body poses, same frontal camera, scale and lighting. No labels, grid, props or effects. Each frame must change the actual eyelids, mouth, arms or body shape; do not repeat a rotated image. Row 1: neutral, inhale, drooping eyelids, closed blink, reopening, exhale, relaxed smile, neutral. Row 2: neutral, raise arm, hand up, wave outward, wave inward smiling, wave outward, lower arm, neutral. Row 3: neutral, hand toward chin, chin supported and eyes up-left, head inclined, blink, look up-right, hand lowers, neutral. Row 4: neutral, crouch and squash, push-off and stretch, airborne arms up, smiling apex, descend, squash landing, neutral. Keep entire poses separated with transparent padding and stable foot baseline except airborne poses.

수정 프롬프트:

> Preserve the character identity and action order. In the wave row use only the viewer-left hand throughout; the other hand stays down. The thinking row also uses the viewer-left hand. Keep body scale and registration consistent. Preserve actual airborne displacement for the jump. Clean transparent background, no text, marks or shadows.

## 재생·접근성

- PNG의 셀 위치만 프레임 단위로 교체한다. `rotate`, `scale` 키프레임이나 셀 사이의 보간은 없다.
- PNG 로딩 완료 후 타이머를 시작한다. 로딩 실패 시 기존 PNG를 정적으로 표시한다.
- 클릭 인사는 다시 재생할 수 있고, 입력 상태가 바뀌면 이전 동작을 취소한다.
- 모션 끄기와 운영체제 `prefers-reduced-motion`은 중립 포즈를 표시한다.
- 비활성 브라우저 탭에서는 타이머를 멈추고, 컴포넌트가 사라지면 타이머와 이벤트 리스너를 정리한다.
- 실제 Card 저장이나 AI 연결 상태에는 영향을 주지 않는다.

## 확인

- 아이보리 배경의 전체 프레임 시트에서 표정·손 방향·기준선·잘림 여부를 확인했다.
- 배포 PNG로 모션 미리보기 GIF를 렌더링했다.
- TypeScript 검사와 프로덕션 빌드 통과.
- 기존 App/Agent UI 12개 + 프레임 재생 테스트 4개, 총 16개 통과.
- 재생 테스트: 로딩 전 정지, 프레임 진행, 인사 1회 후 복귀·재시작, 상태 변경 시 인사 취소, 완료 후 복귀, 일시정지, 로드 실패 대체, 타이머 정리.
- 인증된 운영 화면의 브라우저 시각 검증은 수행하지 않았다. 운영 배포 후 HTML 번들 및 PNG 바이트 일치 여부를 확인한다.
