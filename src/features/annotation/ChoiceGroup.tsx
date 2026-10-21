interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  description: string;
}

interface ChoiceGroupProps<T extends string> {
  number: string;
  title: string;
  name: string;
  value: T | null;
  options: ChoiceOption<T>[];
  onChange: (value: T) => void;
}

export function ChoiceGroup<T extends string>({
  number,
  title,
  name,
  value,
  options,
  onChange,
}: ChoiceGroupProps<T>) {
  return (
    <fieldset className="choice-group">
      <legend>
        <span className="choice-group__number">{number}</span>
        {title}
      </legend>
      <div className="choice-group__options">
        {options.map((option) => (
          <label
            className={`choice-option${value === option.value ? " choice-option--selected" : ""}`}
            key={option.value}
          >
            <input
              checked={value === option.value}
              name={name}
              onChange={() => onChange(option.value)}
              type="radio"
              value={option.value}
            />
            <span className="choice-option__radio" aria-hidden="true" />
            <span className="choice-option__copy">
              <strong>{option.label}</strong>
              <small>{option.description}</small>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
