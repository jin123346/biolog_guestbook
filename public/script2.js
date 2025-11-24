// API 기본 URL (로컬 서버)
const API_URL = '/api/guestbook';

// DOM 요소
const form = document.getElementById('guestbookForm');
const answerInput = document.getElementById('answer');
const entriesContainer = document.getElementById('entriesContainer');
let latestEntries = [];
let resizeTimer = null;
let resizeListenerAttached = false;

// 말풍선 레이아웃 설정 (2,3,2,3,2)
const ROW_PATTERN = [2, 3, 2, 3, 2];
const MAX_BUBBLE_COUNT = ROW_PATTERN.reduce((sum, count) => sum + count, 0); // 12개
const BUBBLE_WIDTH = 360;
const BUBBLE_HEIGHT = 280;
const MIN_GAP_X = 35;
const MAX_GAP_X = 85;
const HEADER_MAX_HEIGHT = 200;
const HEADER_FALLBACK_BOTTOM = 150;
const START_Y_PADDING = 25;

// Enter 키로 제출 (Shift+Enter는 줄바꿈)
if (answerInput) {
    answerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadEntries();
    form.addEventListener('submit', handleSubmit);
    answerInput.focus();
});

// 방명록 작성 처리
async function handleSubmit(e) {
    e.preventDefault();
    
    const answer = answerInput.value.trim();
    
    if (!answer) {
        showMessage('답변을 입력해주세요.', 'error');
        return;
    }
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: '익명', answer }),
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // 입력 필드 비우기
            answerInput.value = '';
            form.reset();
            
            await loadEntries();
            setTimeout(() => answerInput.focus(), 100);
        } else {
            showMessage(data.error || '방명록 작성에 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('서버와의 통신 중 오류가 발생했습니다. 서버가 실행 중인지 확인해주세요.', 'error');
    }
}

// 떠다니는 말풍선 컨테이너
const floatingBubbles = document.getElementById('floatingBubbles');
if (!floatingBubbles) {
    console.error('floatingBubbles 요소를 찾을 수 없습니다.');
}

// 방명록 목록 불러오기
async function loadEntries() {
    try {
        const response = await fetch(API_URL);
        const entries = await response.json();

        if (!entries || entries.length === 0) return;

        latestEntries = entries.slice(0, MAX_BUBBLE_COUNT);
        createFloatingBubbles(latestEntries);

        if (!resizeListenerAttached) {
            resizeListenerAttached = true;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    if (latestEntries.length > 0) {
                        createFloatingBubbles(latestEntries);
                    }
                }, 300);
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// 방명록 항목 요소 생성 (리스트용)
function createEntryElement(entry) {
    const div = document.createElement('div');
    div.className = 'entry';
    div.innerHTML = `
        <div class="entry-header">
            <span class="entry-name">${escapeHtml(entry.name)}</span>
            <span class="entry-date">${entry.date}</span>
        </div>
        <div class="entry-answer">${escapeHtml(entry.answer)}</div>
    `;
    return div;
}

function getEffectiveHeaderBottom() {
    const titleHeaderEl = document.querySelector('.title-header');
    if (!titleHeaderEl) return HEADER_FALLBACK_BOTTOM;
    const rect = titleHeaderEl.getBoundingClientRect();
    return Math.min(rect.bottom, HEADER_MAX_HEIGHT);
}

function buildRowLayout(totalCount) {
    const layout = [];
    let remaining = totalCount;
    let idx = 0;
    while (remaining > 0 && idx < ROW_PATTERN.length) {
        const capacity = ROW_PATTERN[idx];
        const count = Math.min(capacity, remaining);
        layout.push(count);
        remaining -= count;
        idx++;
    }
    return layout;
}

function addSingleBubble(entry) {
    if (!floatingBubbles) {
        console.error('floatingBubbles 요소를 찾을 수 없습니다.');
        return;
    }
    
    // 같은 entry.id를 가진 말풍선 개수 확인
    const existingBubbles = floatingBubbles.querySelectorAll(`[data-entry-id="${entry.id}"]`);
    
    // 최대 1개까지만 허용 (중복 제거)
    if (existingBubbles.length >= 1) {
        return; // 이미 1개가 있으면 추가하지 않음
    }
    
    const limeGreenVariations = [
        { bg: 'rgba(144, 238, 144, 0.75)', border: 'rgba(50, 205, 50, 0.7)' },
        { bg: 'rgba(152, 251, 152, 0.75)', border: 'rgba(124, 252, 0, 0.7)' },
        { bg: 'rgba(173, 255, 47, 0.75)', border: 'rgba(154, 205, 50, 0.7)' },
        { bg: 'rgba(127, 255, 0, 0.75)', border: 'rgba(50, 205, 50, 0.7)' },
        { bg: 'rgba(154, 205, 50, 0.75)', border: 'rgba(124, 252, 0, 0.7)' },
        { bg: 'rgba(50, 205, 50, 0.75)', border: 'rgba(34, 139, 34, 0.7)' }
    ];
    
    const colorSet = limeGreenVariations[Math.floor(Math.random() * limeGreenVariations.length)];
    
    const topSectionEl = document.querySelector('.top-section');
    const topSectionRect = topSectionEl ? topSectionEl.getBoundingClientRect() : null;
    
    const startY = getEffectiveHeaderBottom() + START_Y_PADDING;
    const endY = topSectionRect ? topSectionRect.bottom - 50 : window.innerHeight * 0.6;
    const availableHeight = endY - startY;
    const availableWidth = window.innerWidth - 40;
    
    // 기존 말풍선 개수 확인
    const existingBubblesList = floatingBubbles.querySelectorAll('.floating-bubble');
    const existingCount = existingBubblesList.length;
    
    if (existingCount >= MAX_BUBBLE_COUNT) {
        const oldest = Array.from(existingBubblesList).sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top)[0];
        if (oldest) oldest.remove();
    }
    
    const totalBubbles = Math.min(existingCount + 1, MAX_BUBBLE_COUNT);
    const layout = buildRowLayout(totalBubbles);
    const numRows = layout.length || 1;
    
    const rowHeight = Math.max(BUBBLE_HEIGHT + 30, availableHeight / numRows);
    
    // 새 말풍선은 항상 가장 아래 행의 첫 번째 위치
    const newBubbleIndex = 0;
    const rowIndex = 0; // 가장 아래 행
    const colIndex = 0; // 첫 번째 위치
    const actualRowIndex = numRows - 1; // 가장 아래 행
    
    // Y 위치: 아래에서 위로 (최신이 가장 아래)
    const baseY = startY + actualRowIndex * rowHeight;
    const randomYOffset = Math.min((rowHeight - bubbleHeight) * 0.25, 35);
    let randomY = baseY + Math.random() * Math.max(randomYOffset, 10);
    const maxY = endY - bubbleHeight;
    if (randomY > maxY) {
        randomY = Math.max(baseY, maxY);
    }
    
    // X 위치: 지그재그 패턴으로 배치
    const bubblesInThisRow = layout[rowIndex] || Math.min(2, totalBubbles);
    const usableWidth = Math.max(availableWidth, bubblesInThisRow * BUBBLE_WIDTH + MIN_GAP_X * (bubblesInThisRow - 1));
    const rawGap = bubblesInThisRow > 1 ? (usableWidth - BUBBLE_WIDTH * bubblesInThisRow) / (bubblesInThisRow - 1) : 0;
    const gapX = Math.min(MAX_GAP_X, Math.max(MIN_GAP_X, rawGap));
    const rowContentWidth = bubblesInThisRow * BUBBLE_WIDTH + (bubblesInThisRow - 1) * gapX;
    const rowStartX = Math.max(30, (window.innerWidth - rowContentWidth) / 2);
    
    const zigzagOffset = (rowIndex % 2 === 1) ? gapX / 2 : 0;
    const randomX = rowStartX + zigzagOffset + colIndex * (bubbleWidth + gapX) + (Math.random() * 16 - 8);
    
    // 기존 말풍선들을 위로 이동 (한 행씩 위로)
    existingBubblesList.forEach((bubble) => {
        const currentY = parseFloat(bubble.style.top) || bubble.getBoundingClientRect().top;
        const newY = currentY - rowHeight;
        bubble.style.transition = 'top 0.5s ease-out';
        bubble.style.top = `${newY}px`;
    });
    
    const randomSize = Math.random() * 0.25 + 0.9;
    const randomDelay = Math.random() * 1.5;
    const randomDuration = Math.random() * 2 + 5;
    
    const bubble = document.createElement('div');
    bubble.className = 'floating-bubble';
    bubble.setAttribute('data-entry-id', entry.id);
    
    bubble.style.left = `${randomX}px`;
    bubble.style.top = `${randomY}px`;
    bubble.style.transform = `scale(${randomSize})`;
    bubble.style.backgroundColor = colorSet.bg;
    bubble.style.borderColor = colorSet.border;
    bubble.style.animationDelay = `${randomDelay}s`;
    bubble.style.animationDuration = `${randomDuration}s`;
    
    const textLength = entry.answer.length;
    if (textLength > 100) {
        bubble.style.maxWidth = '320px';
    } else if (textLength > 50) {
        bubble.style.maxWidth = '300px';
    } else {
        bubble.style.maxWidth = '250px';
    }
    
    const displayName = entry.name === '익명' ? '' : entry.name;
    
    bubble.innerHTML = `
        <div class="bubble-content">
            ${displayName ? `<div class="bubble-name">${escapeHtml(displayName)}</div>` : ''}
            <div class="bubble-text">${escapeHtml(entry.answer)}</div>
        </div>
        <div class="bubble-click-hint">클릭하여 닫기</div>
    `;
    
    const removeBubble = () => {
        bubble.style.animation = 'fadeOut 0.4s ease-out forwards';
        bubble.style.pointerEvents = 'none';
        setTimeout(() => {
            if (bubble.parentNode) {
                bubble.remove();
            }
        }, 400);
    };
    
    bubble.addEventListener('click', removeBubble);
    bubble.addEventListener('touchstart', (e) => {
        e.preventDefault();
        removeBubble();
    });
    
    // 페이드인 애니메이션
    bubble.style.opacity = '0';
    bubble.style.transform = `scale(${randomSize * 0.8})`;
    floatingBubbles.appendChild(bubble);
    
    requestAnimationFrame(() => {
        bubble.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        bubble.style.opacity = '1';
        bubble.style.transform = `scale(${randomSize})`;
    });
}

// 떠다니는 말풍선 생성
function createFloatingBubbles(entries) {
    if (!floatingBubbles) {
        console.error('floatingBubbles 요소를 찾을 수 없습니다.');
        return;
    }
    
    floatingBubbles.innerHTML = '';
    
    const tempSelected = entries.slice(0, MAX_BUBBLE_COUNT);
    const entriesToCreate = [];
    const entryCreatedCount = new Map();
    
    tempSelected.forEach(entry => {
        const created = entryCreatedCount.get(entry.id) || 0;
        if (created < 1) {
            entriesToCreate.push(entry);
            entryCreatedCount.set(entry.id, created + 1);
        }
    });
    
    const layout = buildRowLayout(entriesToCreate.length);
    const numRows = layout.length;
    if (numRows === 0) return;
    
    const rowCapacity = layout.reduce((sum, count) => sum + count, 0);
    const selectedEntries = entriesToCreate.slice(0, rowCapacity);
    
    const topSectionEl = document.querySelector('.top-section');
    const topSectionRect = topSectionEl ? topSectionEl.getBoundingClientRect() : null;
    
    const startY = getEffectiveHeaderBottom() + START_Y_PADDING;
    const endY = topSectionRect ? topSectionRect.bottom - 50 : window.innerHeight * 0.6;
    const availableHeight = endY - startY;
    const availableWidth = window.innerWidth - 40;
    const rowHeight = Math.max(BUBBLE_HEIGHT + 30, availableHeight / numRows);
    
    const limeGreenVariations = [
        { bg: 'rgba(144, 238, 144, 0.75)', border: 'rgba(50, 205, 50, 0.7)' },
        { bg: 'rgba(152, 251, 152, 0.75)', border: 'rgba(124, 252, 0, 0.7)' },
        { bg: 'rgba(173, 255, 47, 0.75)', border: 'rgba(154, 205, 50, 0.7)' },
        { bg: 'rgba(127, 255, 0, 0.75)', border: 'rgba(50, 205, 50, 0.7)' },
        { bg: 'rgba(154, 205, 50, 0.75)', border: 'rgba(124, 252, 0, 0.7)' },
        { bg: 'rgba(50, 205, 50, 0.75)', border: 'rgba(34, 139, 34, 0.7)' }
    ];
    
    selectedEntries.forEach((entry, index) => {
        setTimeout(() => {
            const bubble = document.createElement('div');
            bubble.className = 'floating-bubble';
            bubble.setAttribute('data-entry-id', entry.id);
            
            let rowIndex = 0;
            let colIndex = 0;
            let accumulated = 0;
            
            for (let i = 0; i < layout.length; i++) {
                if (index < accumulated + layout[i]) {
                    rowIndex = i;
                    colIndex = index - accumulated;
                    break;
                }
                accumulated += layout[i];
            }
            
            const actualRowIndex = numRows - 1 - rowIndex;
            
            const baseY = startY + actualRowIndex * rowHeight;
            const randomYOffset = Math.min((rowHeight - BUBBLE_HEIGHT) * 0.25, 40);
            let randomY = baseY + Math.random() * Math.max(randomYOffset, 14);
            const maxY = endY - BUBBLE_HEIGHT;
            if (randomY > maxY) randomY = Math.max(baseY, maxY);
            
            const bubblesInThisRow = layout[rowIndex];
            const usableWidth = Math.max(availableWidth, bubblesInThisRow * BUBBLE_WIDTH + MIN_GAP_X * (bubblesInThisRow - 1));
            const rawGap = bubblesInThisRow > 1 ? (usableWidth - BUBBLE_WIDTH * bubblesInThisRow) / (bubblesInThisRow - 1) : 0;
            const gapX = Math.min(MAX_GAP_X, Math.max(MIN_GAP_X, rawGap));
            const rowContentWidth = bubblesInThisRow * BUBBLE_WIDTH + (bubblesInThisRow - 1) * gapX;
            const rowStartX = Math.max(30, (window.innerWidth - rowContentWidth) / 2);
            
            const zigzagOffset = (rowIndex % 2 === 1) ? gapX / 2 : 0;
            const randomX = rowStartX + zigzagOffset + colIndex * (BUBBLE_WIDTH + gapX) + (Math.random() * 12 - 6);
            
            const randomSize = 1.0;
            const colorSet = limeGreenVariations[Math.floor(Math.random() * limeGreenVariations.length)];
            const randomDelay = index * 0.1;
            const randomDuration = 6;
            
            bubble.style.left = `${randomX}px`;
            bubble.style.top = `${randomY}px`;
            bubble.style.transform = `scale(${randomSize})`;
            bubble.style.backgroundColor = colorSet.bg;
            bubble.style.borderColor = colorSet.border;
            bubble.style.animationDelay = `${randomDelay}s`;
            bubble.style.animationDuration = `${randomDuration}s`;
            
            const textLength = entry.answer.length;
            if (textLength > 120) {
                bubble.style.maxWidth = '400px';
            } else if (textLength > 60) {
                bubble.style.maxWidth = '380px';
            } else {
                bubble.style.maxWidth = '340px';
            }
            
            const displayName = entry.name === '익명' ? '' : entry.name;
            bubble.innerHTML = `
                <div class="bubble-content">
                    ${displayName ? `<div class="bubble-name">${escapeHtml(displayName)}</div>` : ''}
                    <div class="bubble-text">${escapeHtml(entry.answer)}</div>
                </div>
                <div class="bubble-click-hint">클릭하여 닫기</div>
            `;
            
            const removeBubble = () => {
                bubble.style.animation = 'fadeOut 0.4s ease-out forwards';
                bubble.style.pointerEvents = 'none';
                setTimeout(() => {
                    if (bubble.parentNode) bubble.remove();
                }, 400);
            };
            
            bubble.addEventListener('click', removeBubble);
            bubble.addEventListener('touchstart', (e) => {
                e.preventDefault();
                removeBubble();
            });
            
            bubble.style.opacity = '0';
            bubble.style.transform = `scale(${randomSize * 0.8})`;
            floatingBubbles.appendChild(bubble);
            
            requestAnimationFrame(() => {
                bubble.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
                bubble.style.opacity = '1';
                bubble.style.transform = `scale(${randomSize})`;
            });
        }, index * 120);
    });
}

// 메시지 표시
function showMessage(message, type) {
    // 기존 메시지 제거
    const existingMessage = document.querySelector('.success-message, .error-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
    messageDiv.textContent = message;
    
    // 폼 컨테이너 찾기
    const formContainer = document.querySelector('.form-container') || document.querySelector('.input-form');
    if (formContainer) {
        formContainer.insertBefore(messageDiv, formContainer.firstChild);
        
        // 3초 후 자동 제거
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    } else {
        // 폼 컨테이너를 찾을 수 없으면 body에 추가
        document.body.appendChild(messageDiv);
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }
}

// HTML 이스케이프 (XSS 방지)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}



