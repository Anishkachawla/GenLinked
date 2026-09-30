
import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from streak import longest_positive_streak

def test_basic():
    assert longest_positive_streak([1, 2, -1, 3, 4, 5]) == 3

def test_all_positive():
    assert longest_positive_streak([1, 2, 3]) == 3

def test_all_negative():
    assert longest_positive_streak([-1, -2, -3]) == 0

def test_mixed():
    assert longest_positive_streak([1, -1, 2, 2, -3, 1]) == 2
