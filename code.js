function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('스마트 현장관리 V6.1')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** HTML include */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/** 시트명 안전 처리 */
function sanitizeSheetName_(name) {
  name = String(name || '').trim();
  if (!name) name = '미지정_현장';

  // 시트명 금지 문자 제거 : \ / ? * [ ]
  name = name.replace(/[:\\\/\?\*\[\]]/g, ' ');
  name = name.replace(/\s+/g, ' ').trim();

  // Google Sheets 시트명 최대 100자
  if (name.length > 100) name = name.slice(0, 100).trim();

  return name || '미지정_현장';
}

/** ✅ 같은 이름 충돌 시 (2), (3) 붙여서 고유 시트명 만들기 */
function getUniqueSheetName_(ss, baseName) {
  let name = baseName;
  let n = 2;
  while (ss.getSheetByName(name)) {
    name = `${baseName}(${n})`;
    n++;
    if (name.length > 100) {
      // 너무 길어지면 baseName을 줄여서 붙임
      const cut = Math.max(1, 100 - String(`(${n})`).length);
      baseName = baseName.slice(0, cut).trim();
      name = `${baseName}(${n})`;
    }
  }
  return name;
}

/** KST 시간 포맷 */
function formatNowKST_() {
  return Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
}

/** 도면 보관함 시트 이름 (한 시트에서 모두 관리) */
const DRAWING_SHEET_NAME = '도면보관함';

/**
 * ✅ 저장: "도면보관함" 시트 하나에 행으로 추가 (한 시트에서 모두 관리)
 * - data는 문자열(JSON)로 들어옴
 */
function saveToSheet(data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const jsonData = JSON.parse(data);

    const rawSiteName = String(jsonData.siteName || '').trim();
    let sheet = ss.getSheetByName(DRAWING_SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(DRAWING_SHEET_NAME, ss.getNumSheets());
      sheet.appendRow(["저장시각", "현장명", "천장고", "요약", "데이터(JSON)"]);
      sheet.getRange(1, 1, 1, 5).setBackground('#1a1a1a').setFontColor('#fff').setFontWeight('bold');
      for (let c = 1; c <= 5; c++) sheet.setColumnWidth(c, 150);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["저장시각", "현장명", "천장고", "요약", "데이터(JSON)"]);
      sheet.getRange(1, 1, 1, 5).setBackground('#1a1a1a').setFontColor('#fff').setFontWeight('bold');
    }

    const ts = formatNowKST_();
    jsonData.date = ts;

    const zonesCount = jsonData.zones ? jsonData.zones.length : 0;
    const wallsCount = jsonData.freeWalls ? jsonData.freeWalls.length : 0;
    const furnCount  = jsonData.furnitureLines ? jsonData.furnitureLines.length : 0;
    const doorsCount = jsonData.doors ? jsonData.doors.length : 0;
    const summary = `구역 ${zonesCount} / 벽선 ${wallsCount} / 가구 ${furnCount} / 문 ${doorsCount}`;
    const payload = JSON.stringify(jsonData);

    if (payload.length > 45000) {
      return `❌ 저장 실패: 도면 데이터가 너무 큽니다(JSON ${payload.length}자).
- 구역:${zonesCount} 벽선:${wallsCount} 가구:${furnCount} 문:${doorsCount}
- 팁: 구역/벽선 개수를 줄이거나 저장 방식을 분리해야 합니다.`;
    }

    sheet.appendRow([ts, rawSiteName, jsonData.height || '', summary, payload]);
    return `✅ 도면보관함에 저장되었습니다!`;
  } catch (e) {
    return "❌ 오류: " + e.toString();
  } finally {
    lock.releaseLock();
  }
}

/**
 * ✅ 경량 목록: "도면보관함"에서 컬럼 1~4(저장시각, 현장명, 천장고, 요약)만 읽어 반환. JSON 컬럼 제외로 첫 로딩 전송량 대폭 감소.
 * - 도면보관함이 없거나 비어 있으면 [] 반환 (프론트에서 getData() 폴백 가능).
 */
function getDataList() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(DRAWING_SHEET_NAME);
    if (!sheet || sheet.getLastRow() < 2) return '[]';

    const lastRow = sheet.getLastRow();
    const rows = sheet.getRange(2, 1, lastRow, 4).getValues();
    const bySite = {};
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const dVal = row[0];
      const siteName = String(row[1] || '').trim();
      const height = row[2];
      const summary = String(row[3] || '').trim();
      const dateStr = (dVal instanceof Date)
        ? Utilities.formatDate(dVal, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss')
        : String(dVal || '');
      if (!siteName) continue;
      if (!bySite[siteName] || dateStr > String(bySite[siteName].date)) {
        bySite[siteName] = { date: dateStr, siteName: siteName, height: height, summary: summary };
      }
    }
    const list = Object.keys(bySite).map(function(k) { return bySite[k]; });
    list.sort(function(a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
    return JSON.stringify(list);
  } catch (e) {
    return '[]';
  }
}

/**
 * ✅ 한 건 로드: 현장명으로 해당 도면 전체 JSON만 가져오기 (썸네일/모달용).
 * - 도면보관함에 없으면 null 반환.
 */
function getDrawingBySiteName(siteName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(DRAWING_SHEET_NAME);
    if (!sheet || sheet.getLastRow() < 2) return null;

    const rawName = String(siteName || '').trim();
    if (!rawName) return null;

    const lastRow = sheet.getLastRow();
    const rows = sheet.getRange(2, 1, lastRow, 5).getValues();
    let best = null;
    let bestDate = '';
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const sn = String(row[1] || '').trim();
      if (sn !== rawName) continue;
      const dVal = row[0];
      const jsonStr = row[4];
      if (typeof jsonStr !== 'string' || !jsonStr.trim()) continue;
      const dateStr = (dVal instanceof Date)
        ? Utilities.formatDate(dVal, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss')
        : String(dVal || '');
      if (dateStr > bestDate) {
        try {
          const item = JSON.parse(jsonStr);
          item.date = dateStr;
          best = item;
          bestDate = dateStr;
        } catch (e) {}
      }
    }
    return best ? JSON.stringify(best) : null;
  } catch (e) {
    return null;
  }
}

/**
 * ✅ 불러오기: "도면보관함" 시트만 있으면 그 시트만 읽어서 반환 (API 1회). 없으면 예전 현장별 시트 순회.
 */
function getData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const bySite = {};
    const sheet = ss.getSheetByName(DRAWING_SHEET_NAME);

    if (sheet && sheet.getLastRow() >= 2) {
      const lastRow = sheet.getLastRow();
      const rows = sheet.getRange(2, 1, lastRow, 5).getValues();
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const dVal = row[0];
        const siteName = String(row[1] || '').trim();
        const jsonStr = row[4];
        if (typeof jsonStr !== 'string' || !jsonStr.trim()) continue;
        try {
          const item = JSON.parse(jsonStr);
          item.date = (dVal instanceof Date)
            ? Utilities.formatDate(dVal, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss')
            : String(dVal || '');
          if (!bySite[siteName] || String(item.date) > String(bySite[siteName].date)) {
            bySite[siteName] = item;
          }
        } catch (e) {}
      }
      const list = Object.keys(bySite).map(function(k) { return bySite[k]; });
      list.sort(function(a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
      return JSON.stringify(list);
    }

    // 도면보관함 없거나 비어 있음: 예전 방식(현장별 시트)으로 읽기
    const sheets = ss.getSheets();
    for (let i = 0; i < sheets.length; i++) {
      const s = sheets[i];
      const name = s.getName();
      if (name.indexOf('(품목)') !== -1 || name.indexOf('견적_') === 0) continue;
      const lastRow = s.getLastRow();
      if (lastRow < 2) continue;
      const row = s.getRange(lastRow, 1, 1, 5).getValues()[0];
      const dVal = row[0];
      const jsonStr = row[4];
      if (typeof jsonStr !== 'string' || !jsonStr.trim()) continue;
      try {
        const item = JSON.parse(jsonStr);
        const siteName = String(item.siteName || row[1] || '').trim();
        item.date = (dVal instanceof Date)
          ? Utilities.formatDate(dVal, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss')
          : String(dVal || '');
        if (!bySite[siteName] || String(item.date) > String(bySite[siteName].date)) {
          bySite[siteName] = item;
        }
      } catch (e) {}
    }
    const list = Object.keys(bySite).map(function(k) { return bySite[k]; });
    list.sort(function(a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
    return JSON.stringify(list);
  } catch (e) {
    return "[]";
  }
}

/**
 * ✅ 삭제: "도면보관함" 시트에서 해당 현장의 최신 저장 행 1개 삭제
 * - "도면보관함" 없으면 예전 방식(현장별 시트 마지막 행 삭제)으로 처리
 */
function deleteFromSheet(siteName) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const rawName = String(siteName || '').trim();
    const sheet = ss.getSheetByName(DRAWING_SHEET_NAME);

    if (sheet && sheet.getLastRow() >= 2) {
      const lastRow = sheet.getLastRow();
      const rows = sheet.getRange(2, 1, lastRow, 2).getValues();
      let deleteRowIndex = -1;
      let latestDate = '';
      for (let r = 0; r < rows.length; r++) {
        if (String(rows[r][1] || '').trim() !== rawName) continue;
        const d = rows[r][0];
        const dateStr = d instanceof Date ? Utilities.formatDate(d, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss') : String(d || '');
        if (dateStr > latestDate) {
          latestDate = dateStr;
          deleteRowIndex = r + 2;
        }
      }
      if (deleteRowIndex >= 0) {
        sheet.deleteRow(deleteRowIndex);
        return "✅ '" + rawName + "' 도면이 삭제되었습니다.";
      }
    }

    // 예전 방식: 현장명으로 된 시트에서 마지막 행 삭제
    const baseName = sanitizeSheetName_(rawName);
    const oldSheet = ss.getSheetByName(baseName);
    if (!oldSheet) return "❌ '" + rawName + "' 데이터를 찾을 수 없습니다.";
    const lastRow = oldSheet.getLastRow();
    if (lastRow < 2) return "❌ 삭제할 데이터가 없습니다.";
    oldSheet.deleteRow(lastRow);
    if (oldSheet.getLastRow() < 2) ss.deleteSheet(oldSheet);
    return "✅ '" + rawName + "' 도면이 삭제되었습니다.";
  } catch (e) {
    return "❌ 삭제 오류: " + e.toString();
  } finally {
    lock.releaseLock();
  }
}

// ========================================
// 견적서 관련 함수
// ========================================

/** 단가표 캐시 키 (CacheService, TTL 180초) */
var PRICE_TABLES_CACHE_KEY = 'priceTables';
var PRICE_TABLES_CACHE_TTL = 180;

/**
 * 📊 모든 단가표 읽기
 * - 캐시 있으면 즉시 반환(시트 읽기 0회). 없으면 (품목) 시트 읽어서 캐시 후 반환.
 */
function getAllPriceTables() {
  try {
    const cache = CacheService.getScriptCache();
    const cached = cache.get(PRICE_TABLES_CACHE_KEY);
    if (cached != null) return cached;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets();
    const result = {};

    sheets.forEach(sheet => {
      const name = sheet.getName();
      if (name.includes('(품목)')) {
        const category = name.replace('(품목)', '').trim();
        const data = sheet.getDataRange().getValues();
        const items = [];
        let hasMaejiSub = false;
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (row[0]) {
            const itemName = String(row[0] || '');
            if (category === '화장실공사' && itemName === '매지 부자재') {
              hasMaejiSub = true;
            }
            items.push({
              item: itemName,
              spec: String(row[1] || ''),
              unit: String(row[2] || ''),
              materialPrice: Number(row[3] || 0),
              laborPrice: Number(row[4] || 0)
            });
          }
        }

        // 화장실공사(품목)에 '매지 부자재'가 없으면 자동으로 한 줄 추가
        if (category === '화장실공사' && !hasMaejiSub) {
          const newRow = ['매지 부자재', '', '포', 0, 0];
          sheet.appendRow(newRow);
          items.push({
            item: newRow[0],
            spec: newRow[1],
            unit: newRow[2],
            materialPrice: newRow[3],
            laborPrice: newRow[4]
          });
        }

        if (items.length > 0) result[category] = items;
      }
    });

    const json = JSON.stringify(result);
    cache.put(PRICE_TABLES_CACHE_KEY, json, PRICE_TABLES_CACHE_TTL);
    return json;
  } catch (e) {
    return JSON.stringify({ error: e.toString() });
  }
}

/**
 * 💾 견적서 저장
 * - estimateData: JSON 문자열
 *   { siteName, area, items: [...], subtotal, overhead, profit, vat, total }
 */
function saveEstimate(estimateData) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const data = JSON.parse(estimateData);
    
    const sheetName = '견적_' + sanitizeSheetName_(data.siteName);
    let sheet = ss.getSheetByName(sheetName);
    
    // 기존 시트가 있으면 삭제하고 새로 생성 (덮어쓰기)
    if (sheet) {
      ss.deleteSheet(sheet);
    }
    
    sheet = ss.insertSheet(sheetName);
    
    // 열 너비 전체 150px
    for (let col = 1; col <= sheet.getMaxColumns(); col++) {
      sheet.setColumnWidth(col, 150);
    }
    
    // 헤더 정보
    sheet.appendRow(['견적서']);
    sheet.appendRow(['현장명:', data.siteName, '평수:', data.area + '평']);
    sheet.appendRow(['작성일:', formatNowKST_()]);
    sheet.appendRow(['']); // 빈 행
    
    // 테이블 헤더
    sheet.appendRow(['No', '품목', '규격', '단위', '수량', '재료비단가', '재료비금액', '노무비단가', '노무비금액', '금액']);
    const headerRow = sheet.getLastRow();
    
    // 공정 순서 (대제목 + 하위 품목)
    const categoryOrder = ['가설철거', '목공사', '전기공사', '설비공사', '화장실공사', '도배필름공사', '바닥공사', '싱크가구공사', '도장공사', '금속유리공사', '기타공사'];
    const byCategory = {};
    data.items.forEach(function(item) {
      if (!byCategory[item.category]) byCategory[item.category] = [];
      byCategory[item.category].push(item);
    });
    
    const sectionRows = [];
    const subtotalRows = [];
    let no = 0;
    categoryOrder.forEach(function(cat) {
      const items = byCategory[cat];
      if (!items || items.length === 0) return;
      sheet.appendRow(['', '■ ' + cat, '', '', '', '', '', '', '', '']);
      sectionRows.push(sheet.getLastRow());
      let catSum = 0;
      items.forEach(function(item) {
        no++;
        catSum += Number(item.totalAmount) || 0;
        sheet.appendRow([
          no,
          item.item,
          item.spec,
          item.unit,
          item.qty,
          item.materialPrice,
          item.materialAmount,
          item.laborPrice,
          item.laborAmount,
          item.totalAmount
        ]);
      });
      sheet.appendRow(['', cat + ' 소계', '', '', '', '', '', '', '', catSum]);
      subtotalRows.push(sheet.getLastRow());
    });
    
    // 합계
    sheet.appendRow(['']);
    sheet.appendRow(['', '', '', '', '', '', '', '', '소계', data.subtotal]);
    sheet.appendRow(['', '', '', '', '', '', '', '', '공과잡비(5%)', data.overhead]);
    sheet.appendRow(['', '', '', '', '', '', '', '', '이윤(10%)', data.profit]);
    sheet.appendRow(['', '', '', '', '', '', '', '', '조정액', data.adjusted]);
    sheet.appendRow(['', '', '', '', '', '', '', '', '총액 (VAT 별도)', data.total]);
    const totalRow = sheet.getLastRow();
    
    // 미리보기처럼 색상 적용
    sheet.getRange(headerRow, 1, headerRow, 10).setBackground('#eeeeee').setFontWeight('bold');
    sectionRows.forEach(function(r) {
      sheet.getRange(r, 1, r, 10).setBackground('#e0e0e0').setFontWeight('bold');
    });
    subtotalRows.forEach(function(r) {
      sheet.getRange(r, 1, r, 10).setBackground('#f5f5f5').setFontWeight('bold');
    });
    sheet.getRange(totalRow - 4, 1, totalRow, 10).setBackground('#f9f9f9');
    sheet.getRange(totalRow, 9, totalRow, 10).setFontWeight('bold').setBackground('#fff3cd');
    
    return `✅ '${sheetName}' 시트에 견적서가 저장되었습니다!`;
  } catch (e) {
    return "❌ 견적서 저장 오류: " + e.toString();
  } finally {
    lock.releaseLock();
  }
}

/**
 * 🔐 관리자 비밀번호 확인
 * - password: 입력된 비밀번호
 * - 반환: true/false
 */
function verifyAdminPassword(password) {
  // 관리자 비밀번호: "2021"
  const correctPassword = '2021';
  return String(password || '').trim() === correctPassword;
}

/**
 * 💾 품목 추가/수정/삭제 저장
 * - category: 공정명 (예: "목공사")
 * - items: 품목 배열 [{item, spec, unit, materialPrice, laborPrice}, ...]
 * - 한 번에 setValues로 쓰기 때문에 appendRow 반복보다 훨씬 빠름
 */
function savePriceTableItems(category, itemsJson) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = category + '(품목)';
    let sheet = ss.getSheetByName(sheetName);
    
    // 품목 데이터 파싱
    const items = JSON.parse(itemsJson);
    
    // 헤더 + 전체 데이터를 2차원 배열로 구성 (한 번에 쓰기)
    const rows = [['품목', '규격', '단위', '재료비단가', '노무비단가']];
    items.forEach(function(item) {
      rows.push([
        String(item.item || ''),
        String(item.spec || ''),
        String(item.unit || ''),
        Number(item.materialPrice || 0),
        Number(item.laborPrice || 0)
      ]);
    });
    
    // 시트가 없으면 생성
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      for (let col = 1; col <= 5; col++) {
        sheet.setColumnWidth(col, 150);
      }
    }
    
    // 한 번에 쓰기 (appendRow 반복 대신 setValues 1회)
    if (rows.length > 0) {
      sheet.getRange(1, 1, rows.length, 5).setValues(rows);
      // 기존에 더 많은 행이 있었으면 남은 행 삭제
      const lastRow = sheet.getLastRow();
      if (lastRow > rows.length) {
        sheet.deleteRows(rows.length + 1, lastRow - rows.length);
      }
    }
    
    // 헤더 서식 (1행만)
    const headerRange = sheet.getRange(1, 1, 1, 5);
    headerRange.setBackground('#000000');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');

    CacheService.getScriptCache().remove(PRICE_TABLES_CACHE_KEY);
    return '✅ ' + category + ' 품목 ' + items.length + '개가 저장되었습니다.';
  } catch (e) {
    return '❌ 저장 오류: ' + e.toString();
  } finally {
    lock.releaseLock();
  }
}

/**
 * 🎯 단가표 초기 설정 (최초 1회만 실행)
 * - Apps Script 에디터에서 이 함수를 선택하고 실행 버튼 클릭
 * - 모든 단가표 시트가 자동으로 생성됩니다
 */
function setupPriceTables() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 단가표 데이터 정의
  const priceTables = {
    '목공사(품목)': [
      ['품목', '규격', '단위', '재료비단가', '노무비단가'],
      ['양면벽체공사', '', 'm²', 17000, 19000],
      ['단면벽체공사', '', 'm²', 12000, 13000],
      ['천장공사', '', 'm²', 15000, 16000],
      ['천장기초 틀대달기', '', 'm', 5000, 7500],
      ['문틀시공', '100박 백골', '개', 120000, 20000],
      ['문틀보수', '100박 백골', '개', 80000, 35000],
      ['문짝시공', '백골(손잡이,경첩포함)', '개', 120000, 30000],
      ['문+문틀시공', '100박 백골(손잡이,경첩포함)', '개', 270000, 65000],
      ['문틀모양내기', '', '개', 0, 0],
      ['중문 슬팀 도어', '높이2100', '개', 1200000, 200000],
      ['중문슬팀3연동', '높이2100', '개', 800000, 200000],
      ['상부장제작', '', 'm', 65000, 50000],
      ['하부장제작', '', 'm', 75000, 50000],
      ['몰딩시공', '20cm계단몰딩 백색', 'm', 2500, 4500],
      ['걸레받이시공', '30cm 백색', 'm', 2500, 3500],
      ['우물천장만들기', '', 'm²', 12000, 15000],
      ['단열작업', '', 'm²', 15000, 13500],
      ['보강작업', '', '식', 0, 0],
      ['벽체 모양내기', '', '식', 0, 0],
      ['다테일공사', '', '식', 0, 0],
      ['공구손료', '', '인', 0, 60000],
      ['철물', '', '식', 0, 0]
    ],
    
    '전기공사(품목)': [
      ['품목', '규격', '단위', '재료비단가', '노무비단가'],
      ['전기배선공사(인)', '전선 및 배관', '인', 25000, 280000],
      ['전기배선공사(평)', '전선 및 배관', '평', 40000, 120000],
      ['분전한 교체공사', '', '식', 0, 0],
      ['단독 전기선 공사', '', '평', 0, 0],
      ['매입 센서등', '3인치 타공형', '개', 27000, 4000],
      ['센서등', '6인치', '개', 15000, 4000],
      ['거실등', '', '개', 160000, 6000],
      ['방등', '오스람led', '개', 55000, 4000],
      ['주방등', '코콤led', '개', 35000, 4000],
      ['식탁등', 'led포함', '개', 45000, 4000],
      ['베란다등', '', '개', 25000, 4000],
      ['거실벽등', '', '개', 18000, 4000],
      ['3인치 매입등', '', '개', 4500, 2500],
      ['매입형 스피커', '', '개', 18000, 6000],
      ['광정식 감지기', '', '개', 45000, 2000],
      ['알산화탄소감지기', '', '개', 68000, 2000],
      ['차동식감지기', '', '개', 8000, 2000],
      ['스위치', '제일디아트 1급 기준', '개', 2600, 2000],
      ['콘센트', '제일디아트 2급 기준', '개', 3000, 2000],
      ['방우콘센트', '제일디아트 2급 기준', '개', 5000, 2000],
      ['전화,인터넷 콘센트', '', '개', 3000, 2000],
      ['T5', '1200mm기준', '개', 10000, 1000],
      ['T5간접라인', '1200mm기준', '개', 10000, 1000],
      ['레인스웨이', '', 'm', 16000, 10000],
      ['레일', '', 'm', 10000, 4000],
      ['레일등', '비츠로 원통 v cob 10w', '개', 8000, 1000],
      ['벽까기', '', 'm', 0, 25000],
      ['실링팬', '로슬러 프라임R 17cm', '개', 309000, 30000]
    ],
    
    '화장실공사(품목)': [
      ['품목', '규격', '단위', '재료비단가', '노무비단가'],
      ['화장실 바닥타일', '600*600', 'm²', 22000, 24000],
      ['화장실 벽체타일', '600*600', 'm²', 22000, 24000],
      ['매지', '', '인', 0, 250000],
      ['매지 부자재', '', '포', 0, 0],
      ['타일부자재', '', 'm²', 10000, 0],
      ['양변기', 'into 양변기 c1002', '개', 190000, 40000],
      ['세면대', 'into 세면대 L337-1', '개', 140000, 50000],
      ['세면수전', '비엔트 GB 5001 SS', '개', 42500, 8500],
      ['욕조샤워수전', '비엔트 GB 5005 SS', '개', 85000, 10000],
      ['욕실액서사리', '비엔트 4품세트', '개', 75000, 10000],
      ['수건걸이', '비엔트', '개', 25000, 3000],
      ['휴지걸이', '비엔트', '개', 28000, 3000],
      ['트렌치 라인 유가(통)', '비엔트 66*800', '개', 93000, 15000],
      ['라인 유가(사각)', '비엔트 150*150', '개', 35000, 10000],
      ['청소걸', '비엔트 청소걸', '개', 18000, 5000],
      ['해바라기샤워수전', '비엔트 레인수전2009', '개', 140000, 15000],
      ['습진장', '', '개', 160000, 20000],
      ['돔천장', '1500*800', '개', 160000, 30000],
      ['간접 타입 욕실거울', '600*800', '개', 130000, 10000],
      ['욕조', '매립욕조1500~1700mm', '개', 185000, 40000],
      ['욕조조적', '', '식', 80000, 120000],
      ['젠다이만들기', '', '식', 90000, 120000],
      ['슬리컷시공', '', 'm', 0, 20000],
      ['타일세면대', '700*465*250', '개', 450000, 150000],
      ['휴젠트', 'FHD-P150S1', '개', 396000, 20000],
      ['힘펠천풍기', 'C2-100LF', '개', 49000, 15000],
      ['가벽', '폼세라믹', '장', 25000, 60000],
      ['큐비클', '', 'm²', 85000, 13000],
      ['유리부스', '', 'm²', 85000, 13000],
      ['잡부', '앗죵', '인', 0, 160000]
    ],
    
    '가설철거(품목)': [
      ['품목', '규격', '단위', '재료비단가', '노무비단가'],
      ['먹메김/내부 수평비계', '', 'm²', 700, 0],
      ['보양/현장 정리작업', '', 'm²', 650, 1300],
      ['공사중폐자재반출', '1ton 트럭', '대', 280000, 150000],
      ['전체철거', '', '평', 0, 35000],
      ['천장철거', '', 'm²', 0, 10000],
      ['벽면철거', '', 'm²', 0, 8334],
      ['조명철거', '', '평', 0, 5000],
      ['화장실 집기철거', '탁월제외', '개소', 0, 80000],
      ['화장실 타일제거', '방수전까지', 'm²', 0, 15000],
      ['화단철거', '', '개소', 0, 50000],
      ['마루철거', '', '평', 0, 30000],
      ['타일철거', '', 'm²', 0, 15000],
      ['확장부철거', '', '개', 0, 300000],
      ['대코타일철거', '', '평', 0, 25000],
      ['장판철거', '', '평', 0, 8000],
      ['붙박이장철거', '30cm', '자', 0, 9000],
      ['신발장철거', '30cm', '자', 0, 9000],
      ['몰딩, 걸레받이철거', '', '평', 0, 6500],
      ['싱크대철거', '30cm', '자', 0, 9000],
      ['방문철거', '', '개', 0, 12000],
      ['방문+문틀철거', '', '개소', 0, 23000],
      ['문지방 철거', '미장까지', '개', 0, 13000],
      ['중문철거', '', '개', 0, 50000],
      ['베란다문 철거', '', '개', 0, 35000],
      ['샤시철거', '', '식', 0, 0],
      ['잡부', '앗종', '인', 0, 180000]
    ],
    
    '설비공사(품목)': [
      ['품목', '규격', '단위', '재료비단가', '노무비단가'],
      ['온짝시공', '넥슨타임이 경포함', '개', 120000, 30000],
      ['몬틀보수', '100박 백골', '개', 80000, 35000],
      ['중문슬림연동', '', '개', 800000, 0],
      ['몰딩시공', '20cm계단롤팅 백색', 'm', 2500, 4500],
      ['걸레받이시공', '30cm 백색', 'm', 2500, 3500]
    ],
    
    '도배필름공사(품목)': [
      ['품목', '규격', '단위', '재료비단가', '노무비단가'],
      ['도배', '', '평', 7000, 8000],
      ['실크', '', '평', 11000, 9000],
      ['친환경도배', '', '평', 9000, 8000],
      ['필름', '', '평', 12000, 10000]
    ],
    
    '바닥공사(품목)': [
      ['품목', '규격', '단위', '재료비단가', '노무비단가'],
      ['현관타일', '600*600', 'm²', 22000, 24000],
      ['베란다타일', '600*600', 'm²', 22000, 24000],
      ['홈타일', '600*600', 'm²', 22000, 24000],
      ['타일부자재', '', 'm²', 5000, 0],
      ['강마루', '동화 나투스전', '평', 98000, 18000],
      ['장판', 'LG1.8T', '평', 24000, 11000],
      ['데코타일', '', '평', 28000, 11000],
      ['애폭시', '', '평', 90000, 30000]
    ],
    
    '싱크가구공사(품목)': [
      ['품목', '규격', '단위', '재료비단가', '노무비단가'],
      ['붙박이장', '자(30cm)', '', 110000, 0],
      ['시스템장', '자(30cm)', '', 90000, 0],
      ['아일랜드', '자(30cm)', '', 160000, 0],
      ['싱크대', '기본후드포함', '자(30cm)', 180000, 0],
      ['샌딩장', '자(30cm)', '', 160000, 0],
      ['화장대', '자(30cm)', '', 115000, 0],
      ['싱크문', '상부 or 하부', '자(31cm)', 30000, 0],
      ['백조싱크볼', 'CNR730(400*680*245)', '개', 182000, 30000],
      ['싱크수전', '비엔트 GWS3000', '개', 63000, 10000],
      ['인덕션', '쿠첸 CIR-EB330TOB2', '개', 380000, 30000],
      ['가스레인지', '하츠 GC-3605SDBH', '개', 198000, 10000],
      ['붙박이의자쿠션', '동봉이포함', '석(50cm)', 140000, 0],
      ['러커', '300*600*2100', '개', 160000, 0],
      ['알반장', '자(30cm)', '', 110000, 0]
    ],
    
    '도장공사(품목)': [
      ['품목', '규격', '단위', '재료비단가', '노무비단가'],
      ['도장밑작업', '퍼티작업', 'm²', 3500, 5500],
      ['도장작업', '', 'm²', 6000, 4500],
      ['스테인작업', '', 'm²', 6500, 5500],
      ['비닐보양', '', 'm²', 500, 1000],
      ['탄성코트', '', 'm²', 13000, 8000]
    ],
    
    '금속유리공사(품목)': [
      ['품목', '규격', '단위', '재료비단가', '노무비단가'],
      ['현지', '', '개', 180000, 0],
      ['유리', '10T', '자', 6800, 0],
      ['악건', '', '인', 0, 300000],
      ['거울', '', '자', 4500, 0],
      ['유리문', '900*2100', '개', 450000, 0],
      ['금속파이프', '30*30각', 'm', 0, 0],
      ['샤시공사', '영림샤시', '식', 0, 0],
      ['크레인', '후투 걸대', '대', 0, 500000]
    ],
    
    '기타공사(품목)': [
      ['품목', '규격', '단위', '재료비단가', '노무비단가'],
      ['청소', '', '평', 18000, 0],
      ['실리콘마감', '', '평', 3000, 15000],
      ['승강기사용료', '', '식', 0, 0],
      ['크레인사용료', '반나절', '', 300000, 0]
    ]
  };
  
  // 각 단가표 시트 생성
  for (const [sheetName, data] of Object.entries(priceTables)) {
    let sheet = ss.getSheetByName(sheetName);
    
    // 기존 시트가 있으면 삭제
    if (sheet) {
      ss.deleteSheet(sheet);
    }
    
    // 새 시트 생성
    sheet = ss.insertSheet(sheetName);
    
    // 데이터 입력
    data.forEach(row => {
      sheet.appendRow(row);
    });
    
    // 헤더 행 서식 설정
    const headerRange = sheet.getRange(1, 1, 1, 5);
    headerRange.setBackground('#000000');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    
    // 열 너비 전체 150px
    for (let col = 1; col <= sheet.getMaxColumns(); col++) {
      sheet.setColumnWidth(col, 150);
    }
    
    Logger.log(`✅ ${sheetName} 생성 완료`);
  }
  
  // 완료 메시지
  const ui = SpreadsheetApp.getUi();
  ui.alert('✅ 단가표 초기 설정 완료!', 
    `총 ${Object.keys(priceTables).length}개의 단가표가 생성되었습니다.\n\n` +
    '생성된 시트:\n' +
    Object.keys(priceTables).join('\n'),
    ui.ButtonSet.OK);
}
