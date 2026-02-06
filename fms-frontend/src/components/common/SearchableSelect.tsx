import { Select, SelectProps } from 'antd'
import { useState, useMemo } from 'react'

interface SearchableSelectProps<T = any> extends Omit<SelectProps, 'options' | 'filterOption'> {
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

  return (
    <Select
      {...props}
      showSearch
      filterOption={false}
      onSearch={setSearchValue}
      options={filteredOptions}
      loading={props.loading}
      notFoundContent={props.loading ? 'Loading...' : 'No options found'}
    />
  )
}
