# TO-DO ZONE

해야 할 일을 카드로 만들어 보드 위에서 관리하는 개인용 웹앱의 용어집.

## Language

**Card (카드)**:
사용자가 해야 할 일 하나. 앱에서 다루는 가장 작은 작업 단위다.
_Avoid_: 할 일, 태스크, 투두, Task, Todo, Item

**Project (프로젝트)**:
카드를 묶는 분류. 모든 카드는 정확히 하나의 Project에 속하고, Project마다 고유한 카드 색을 가진다.
_Avoid_: 카테고리, 폴더, 태그, Label

**Inbox**:
Project를 지정하지 않은 카드가 들어가는 기본 Project. 항상 존재하며 삭제하거나 이름을 바꿀 수 없다.
_Avoid_: 미분류, 기본 폴더

**Status (상태)**:
카드의 진행 단계. **Todo**, **Doing**, **Done** 세 가지로 고정되어 있고, 보드에서 각 Status가 하나의 열로 보인다.
_Avoid_: 열, Column, List, 단계

**Done (완료)**:
Status가 Done인 카드. 카드가 완료되었는지는 Status로만 판단한다.
_Avoid_: 체크됨, 끝남, Completed

**Due date (마감일)**:
카드를 끝내야 하는 날짜. 시간 없이 날짜만 가진다.
_Avoid_: 기한, 데드라인, Deadline

**Overdue (지남)**:
Done이 아닌데 Due date가 오늘보다 이전인 카드의 상태. Done 카드는 Overdue가 될 수 없다.
_Avoid_: 연체, 늦음, Late

**Progress (진행률)**:
Board에 보이는 한 Project의 카드(Todo + Doing + 이번 Quarter의 Done) 중 Done 카드의 비율. 카드가 0장이면 0%다.
_Avoid_: 달성률, 완료율

**Completed at (완료 시각)**:
Card가 Done에 들어간 시각. Done에서 나가면 사라진다.
_Avoid_: 완료일, 끝난 날, Finished date

**Quarter (분기)**:
달력 기준 3개월 묶음(Q1 1–3월, Q2 4–6월, Q3 7–9월, Q4 10–12월). 사용자 컴퓨터의 날짜로 판단한다.
_Avoid_: 학기, 시즌, 기간

**Archive (아카이브)**:
Completed at이 지난 Quarter에 속하는 Done Card들. Board에서는 빠지고 회고 대시보드에서만 보인다. 따로 저장하는 상태가 아니라 날짜로 정해진다.
_Avoid_: 보관함, 숨김, 휴지통

**Board (보드)**:
모든 Project의 카드를 Status별로 한 화면에 보여주는 곳. Archive는 보이지 않는다. 앱에 Board는 하나뿐이다.
_Avoid_: 대시보드, 칸반, 메인

**Quarterly Review (회고 대시보드)**:
Quarter를 골라 그때 끝낸 카드를 돌아보는 화면. Archive를 보는 유일한 곳이다.
_Avoid_: 통계, 리포트, 아카이브 페이지
