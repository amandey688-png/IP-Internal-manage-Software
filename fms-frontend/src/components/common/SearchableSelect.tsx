import { Select, SelectProps } from 'antd'
import type { DefaultOptionType } from 'antd/es/select'
import { useState, useMemo, useRef, useCallback, useEffect } from 'react'

interface SearchableSelectProps<T extends string | number | null = string | number> extends Omit<SelectProps, 'options' | 'filterOption'> {
  options: Array<{ label: string; value: T }>
  debounceMs?: number
}

export const SearchableSelect = <T extends string | number | null>({
  options,
  debounceMs = 300,
  ...props
}: SearchableSelectProps<T>) => {
  const [searchValue, setSearchValue] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setSearchDebounced = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => setSearchValue(value), debounceMs)
    },
    [debounceMs]
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const filteredOptions = useMemo(() => {
    if (!searchValue) {
      return options
    }

    const lowerSearch = searchValue.toLowerCase()
    return options.filter((option) =>
      option.label.toLowerCase().includes(lowerSearch)
    )
  }, [options, searchValue])

  const selectOptions: DefaultOptionType[] = filteredOptions.map((o) => ({ label: o.label, value: o.value }))

  return (
    <Select
      {...props}
      showSearch
      filterOption={false}
      onSearch={setSearchDebounced}
      options={selectOptions}
      notFoundContent={props.loading ? 'Loading...' : 'No options found'}
    />
  )
}
