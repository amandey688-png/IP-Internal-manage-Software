import { Select, SelectProps } from 'antd'
import type { DefaultOptionType } from 'rc-select/lib/Select'
import { useState, useMemo } from 'react'

interface SearchableSelectProps<T = string | number> extends Omit<SelectProps, 'options' | 'filterOption'> {
  options: Array<{ label: string; value: T }>
  debounceMs?: number
}

export const SearchableSelect = <T,>({
  options,
  debounceMs = 300,
  ...props
}: SearchableSelectProps<T>) => {
  const [searchValue, setSearchValue] = useState('')

  const filteredOptions = useMemo(() => {
    if (!searchValue) {
      return options
    }

    const lowerSearch = searchValue.toLowerCase()
    return options.filter((option) =>
      option.label.toLowerCase().includes(lowerSearch)
    )
  }, [options, searchValue])

  const selectOptions: DefaultOptionType[] = filteredOptions.map((o) => ({ label: o.label, value: o.value as string | number | null }))

  return (
    <Select
      {...props}
      showSearch
      filterOption={false}
      onSearch={setSearchValue}
      options={selectOptions}
      loading={props.loading}
      notFoundContent={props.loading ? 'Loading...' : 'No options found'}
    />
  )
}
