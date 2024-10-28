"use client";

import { useState, useEffect } from 'react';
import { TextField, Autocomplete, CircularProgress } from '@mui/material';

const DepartmentAutocomplete = ({ cityName, handleChange, error, helperText }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const onChange = (e, value) => {
    handleChange(e, 'department', value?.Description)
  };

  const fetchDepartments = async (query = '') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/novaposhta?cityName=${cityName}&search=${query}`);
      if (!response.ok) {
        throw new Error('Failed to fetch cities');
      }
      const data = await response.json();
      setOptions(data || []);
    } catch (error) {
      console.error('Error fetching cities:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchDepartments();
    }
  }, [open]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (inputValue.length >= 2) {
        fetchDepartments(inputValue);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue]);

  return (
    <Autocomplete
      id="department-autocomplete"
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      isOptionEqualToValue={(option, value) => option.Ref === value.Ref}
      getOptionLabel={(option) => option.Description || ''}
      options={options}
      loading={loading}
      onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
      onChange={onChange}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Відділення нової пошти"
          error={error}
          helperText={helperText}
          required
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};

export default DepartmentAutocomplete;
