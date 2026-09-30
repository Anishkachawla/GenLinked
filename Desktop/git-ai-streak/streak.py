
def longest_positive_streak(numbers):
    longest = current = 0
    for n in numbers:
        if n > 0:
            current += 1
            longest = max(longest, current)
        else:
            current = 0
    return longest
