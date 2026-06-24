class ValidationError(ValueError):
    pass


def integer(value, name, default=None, minimum=None, maximum=None):
    if value is None or value == '':
        if default is not None:
            return default
        raise ValidationError(f'{name} is required.')
    try:
        result = int(value)
    except (TypeError, ValueError):
        raise ValidationError(f'{name} must be an integer.') from None
    if minimum is not None and result < minimum:
        raise ValidationError(f'{name} must be at least {minimum}.')
    if maximum is not None and result > maximum:
        raise ValidationError(f'{name} must be at most {maximum}.')
    return result


def decimal(value, name, default=None, minimum=None, maximum=None):
    if value is None or value == '':
        return default
    try:
        result = float(value)
    except (TypeError, ValueError):
        raise ValidationError(f'{name} must be a number.') from None
    if minimum is not None and result < minimum:
        raise ValidationError(f'{name} must be at least {minimum}.')
    if maximum is not None and result > maximum:
        raise ValidationError(f'{name} must be at most {maximum}.')
    return result


def optional_integer(value, name, minimum=None, maximum=None):
    if value is None or value == '':
        return None
    return integer(value, name, minimum=minimum, maximum=maximum)
