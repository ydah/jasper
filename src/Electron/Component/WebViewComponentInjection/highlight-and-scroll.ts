{
  // @ts-ignore
  const prevReadAt = _prevReadAt_;
  const highlightCommentEls: Element[] = [];

  exec();

  async function exec() {
    // highlight comment
    await openResolvedThread();
    await replaceEditedTime();
    highlightComments();
    closeNoHighlightResolvedThread();

    // scroll to latest
    scrollToHighlight();

    // add highlight indicator
    addHighlightIndicator();
  }

  async function replaceEditedTime() {
    const editHistories = Array.from(document.querySelectorAll('.js-comment-edit-history-menu')).map(el => el.parentElement);
    for (const editHistory of editHistories) {
      editHistory.setAttribute('open', 'true');
      // @ts-ignore
      editHistory.querySelector('details-menu').style.opacity = 0;
    }

    // wait for loading
    for (let i = 0; i < 30; i++) {
      await sleep(30);

      let loadedCount = 0;
      for (const editHistory of editHistories) {
        if (editHistory.querySelector('relative-time')) loadedCount++;
      }
      if (loadedCount === editHistories.length) break;
    }

    // replace
    const comments = Array.from(document.querySelectorAll('.review-comment, .discussion-item-review, .timeline-comment'));
    for (const comment of comments) {
      const editedTimeEl = comment.querySelector('.js-comment-edit-history-menu relative-time');
      if (editedTimeEl) {
        const editedTime = new Date(editedTimeEl.getAttribute('datetime'));
        const timeEl = comment.querySelector('.js-timestamp relative-time');
        timeEl && timeEl.setAttribute('datetime', dateUTCFormat(editedTime));
      }
    }

    // close
    for (const editHistory of editHistories) {
      editHistory.removeAttribute('open');
      // @ts-ignore
      editHistory.querySelector('details-menu').style.opacity = 1;
    }
  }

  async function openResolvedThread() {
    const containers = Array.from(
      document.querySelectorAll('.js-resolvable-timeline-thread-container[data-resolved="true"]:not(.has-inline-notes)')
    );

    if (containers.length) {
      // outdatedしている箇所を一度openして、中身を読み込ませる
      for (const container of containers) {
        container.setAttribute('open', 'true');
      }

      // 全てのresolvedの中が読み込まれるまで待機
      for (let i = 0; i < 30; i++) {
        await sleep(30);

        let loadedCount = 0;
        for (const container of containers) {
          if (container.classList.contains('has-inline-notes')) loadedCount++;
        }
        if (loadedCount === containers.length) break;
      }
    }
  }

  function closeNoHighlightResolvedThread() {
    const containers = Array.from(
      document.querySelectorAll('.js-resolvable-timeline-thread-container[data-resolved="true"]')
    );
    for (const container of containers) {
      const comment = container.querySelector('.highlight-comment');
      if (!comment) container.removeAttribute('open');
    }
  }

  function highlightComments() {
    const comments = Array.from(document.querySelectorAll('.review-comment, .discussion-item-review, .timeline-comment'));
    for (const comment of comments) {
      const timeEl = comment.querySelector('.js-timestamp relative-time');
      if (!timeEl) continue;

      const time = new Date(timeEl.getAttribute('datetime')).getTime();
      if (time > prevReadAt) {
        comment.classList.add('highlight-comment');
        highlightCommentEls.push(comment);
      }
    }
  }

  function addHighlightIndicator() {
    if (!highlightCommentEls.length) return;
    if (!prevReadAt) return;

    const indicatorEl = document.createElement('div');
    indicatorEl.classList.add('highlight-indicator');
    document.body.appendChild(indicatorEl);

    const rect = document.querySelector('.js-discussion').getBoundingClientRect();
    const timelineHeight = rect.height;
    const timelineOffset = rect.top + window.pageYOffset; //.js-discussionのheightを使うために、commentの絶対位置をオフセットする必要がある
    for (const comment of highlightCommentEls) {
      // calc mark position
      const absYOnViewPort = comment.getBoundingClientRect().top + window.pageYOffset;
      const absYOnTimeline = absYOnViewPort - timelineOffset;
      const y = absYOnTimeline / timelineHeight * 100;

      // create mark
      const markOffset = (50 - y) / 50 * 10; // markの位置がindicatorの上下ぴったりに来ないように、「中央(50%)を原点として、そこからの距離で0~10のオフセット」をつける
      const mark = document.createElement('div');
      mark.classList.add('highlight-indicator-mark');
      mark.style.top = `calc(${y}% + ${markOffset}px)`;
      indicatorEl.appendChild(mark);

      // click mark
      mark.addEventListener('click', () => {
        comment.scrollIntoView({block: 'center'});
        const marks = Array.from(indicatorEl.querySelectorAll('.highlight-indicator-mark')) as HTMLElement[];
        recursiveMarkDone(mark, marks);
      });
    }
  }

  function recursiveMarkDone(doneMark: HTMLElement, marks: HTMLElement[]) {
    doneMark.classList.add('highlight-indicator-mark-done');
    const rect = doneMark.getBoundingClientRect();
    const doneTop = Math.floor(rect.top);
    const doneBottom = Math.ceil(rect.top + rect.height);

    for (const mark of marks) {
      if (mark.classList.contains('highlight-indicator-mark-done')) continue;
      const rect = mark.getBoundingClientRect();
      const top = Math.floor(rect.top);
      const bottom = Math.ceil(rect.top + rect.height);
      if (bottom >= doneTop && bottom <= doneBottom) {
        mark.classList.add('highlight-indicator-mark-done');
        recursiveMarkDone(mark, marks);
      }
      if (top >= doneTop && top <= doneBottom) {
        mark.classList.add('highlight-indicator-mark-done');
        recursiveMarkDone(mark, marks);
      }
    }
  }

  function scrollToHighlight() {
    const comment = document.querySelector('.highlight-comment');
    comment && comment.scrollIntoView({block: 'center'});
  }

  function sleep(msec) {
    return new Promise((resolve) => {
      setTimeout(resolve, msec);
    });
  }

  function dateUTCFormat(date: Date): string {
    const Y = date.getUTCFullYear();
    const M = `${date.getUTCMonth() + 1}`.padStart(2, '0');
    const D = `${date.getUTCDate()}`.padStart(2, '0');
    const h = `${date.getUTCHours()}`.padStart(2, '0');
    const m = `${date.getUTCMinutes()}`.padStart(2, '0');
    const s = `${date.getUTCSeconds()}`.padStart(2, '0');

    return `${Y}-${M}-${D}T${h}:${m}:${s}Z`;
  }
}
