import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export const DEFAULT_INFINITE_CHUNK = 15

type UseInfiniteScrollChunkArgs<T> = {
  items: T[]
  chunkSize?: number
  loading?: boolean
}

export function useInfiniteScrollChunk<T>({
  items,
  chunkSize = DEFAULT_INFINITE_CHUNK,
  loading = false,
}: UseInfiniteScrollChunkArgs<T>) {
  const [visibleCount, setVisibleCount] = useState(chunkSize)
  const containerRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setVisibleCount(chunkSize)
  }, [items, chunkSize])

  const hasMore = visibleCount < items.length

  const loadMore = useCallback(() => {
    if (loading) return
    setVisibleCount((prev) => Math.min(items.length, prev + chunkSize))
  }, [loading, items.length, chunkSize])

  useEffect(() => {
    if (loading) return
    if (!hasMore) return
    const tableBodyRoot = containerRef.current?.querySelector('.ant-table-body') as HTMLElement | null
    const sentinel = sentinelRef.current
    if (!sentinel) return
    // If sentinel is rendered outside table scroll body, fallback to viewport observer.
    const root = tableBodyRoot && tableBodyRoot.contains(sentinel) ? tableBodyRoot : null

    // Fast path: if sentinel is already visible when observer mounts, load immediately.
    const sentinelRect = sentinel.getBoundingClientRect()
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight
    if (sentinelRect.top <= viewportHeight + 160) {
      loadMore()
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        loadMore()
      },
      // If table body exists, observe inside it; otherwise fall back to page scroll.
      { root: root ?? null, rootMargin: '160px', threshold: 0 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loading, hasMore, loadMore])

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount])

  return {
    visibleItems,
    visibleCount,
    hasMore,
    total: items.length,
    containerRef,
    sentinelRef,
  }
}
