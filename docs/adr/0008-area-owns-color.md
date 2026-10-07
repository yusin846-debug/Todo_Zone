# 카드 색은 Project가 아니라 Area가 정한다

Project가 늘어나면서(6개) 4색을 돌려 쓰다 보니 서로 관계없는 Project(예: 사업 일과 개인 일)가 같은 색이 되었다. 사용자가 Project를 Business / Career / Ventures / Life라는 상위 영역(Area)으로 묶고 싶어 했고, Area가 4개라 팔레트 4색과 1:1로 맞는다. 그래서 색을 Area에 주고, 카드 색만 보고 영역을 알아보게 했다. 같은 Area 안의 Project는 아이콘(D-062)으로 구분한다. Area가 없는 Project와 Inbox는 "아직 분류하지 않음"이라는 뜻으로 크림색을 쓴다.

## Considered Options

- Project 색 유지 + Area는 라벨만: 색이 겹치는 문제가 그대로 남는다.
- Area 색 + Project마다 명도 차이: 파스텔 위에서 명도 차이가 작아 구분되지 않고, 대비 검증(4.5)을 다시 해야 한다.

## Consequences

- `projects.color` 열을 없애고 `areas.color`를 둔다. Project 색 고르기 UI는 사라진다.
- Area가 5개 이상이면 색이 겹칠 수 있다(허용).
