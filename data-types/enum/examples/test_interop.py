"""Checks the interoperability examples in ../README.md.

Run with: python test_interop.py
Requires: numpy, pyarrow, polars, duckdb
"""

import duckdb
import numpy as np
import polars as pl
import pyarrow as pa
import pyarrow.compute as pc

VALUES = [1.5, None, 3.0, None]
TAGS = [True, False, True, False]  # [missing, T]: tag 1 = value
PAYLOADS = [1.5, 3.0]


def scatter(tags, payloads):
    full = np.zeros(len(tags))
    full[tags] = payloads
    return full


def test_arrow_round_trip():
    a = pa.array(VALUES)
    tags = a.is_valid().to_numpy(zero_copy_only=False)
    payloads = a.drop_null().to_numpy(zero_copy_only=False)
    assert tags.tolist() == TAGS
    assert payloads.tolist() == PAYLOADS
    b = pa.array(scatter(tags, payloads), mask=~tags)
    assert b.to_pylist() == VALUES


def test_polars_round_trip():
    s = pl.Series(VALUES)
    tags = s.is_not_null().to_numpy()
    payloads = s.drop_nulls().to_numpy()
    assert tags.tolist() == TAGS
    assert payloads.tolist() == PAYLOADS
    t = pl.from_arrow(pa.array(scatter(tags, payloads), mask=~tags))
    assert t.to_list() == VALUES


def test_nan_is_a_value_not_missing():
    assert pa.array([1.0, float("nan"), None]).is_null().to_pylist() == [
        False,
        False,
        True,
    ]
    assert pl.Series([1.0, float("nan"), None]).is_null().to_list() == [
        False,
        False,
        True,
    ]


def test_kleene_logic():
    # rows: (missing AND false), (missing AND true), (missing OR true), (missing OR false)
    expect_and = [False, None]
    expect_or = [True, None]

    a = pa.array([None, None], type=pa.bool_())
    assert pc.and_kleene(a, pa.array([False, True])).to_pylist() == expect_and
    assert pc.or_kleene(a, pa.array([True, False])).to_pylist() == expect_or

    s = pl.Series([None, None], dtype=pl.Boolean)
    assert (s & pl.Series([False, True])).to_list() == expect_and
    assert (s | pl.Series([True, False])).to_list() == expect_or

    row = duckdb.sql(
        "SELECT NULL AND FALSE, NULL AND TRUE, NULL OR TRUE, NULL OR FALSE, "
        "NOT NULL::BOOLEAN, NULL = NULL"
    ).fetchall()[0]
    assert row == (False, None, True, None, None, None)


def test_sql_nullable_column():
    con = duckdb.connect()
    con.execute("CREATE TABLE t(x DOUBLE)")
    con.execute("INSERT INTO t VALUES (1.5), (NULL), (3.0), (NULL)")
    assert con.sql("SELECT x IS NULL FROM t").fetchall() == [
        (False,),
        (True,),
        (False,),
        (True,),
    ]
    assert con.sql("SELECT COUNT(x), SUM(x), AVG(x) FROM t").fetchall()[0] == (
        2,
        4.5,
        2.25,
    )


def test_int64_float64_union():
    # [7, 2.5, 4.0, 9] with tags [0, 1, 1, 0]
    ids = pa.array([0, 1, 1, 0], type=pa.int8())
    offsets = pa.array([0, 0, 1, 1], type=pa.int32())
    u = pa.UnionArray.from_dense(
        ids,
        offsets,
        [pa.array([7, 9], pa.int64()), pa.array([2.5, 4.0], pa.float64())],
        ["int", "float"],
    )
    assert u.to_pylist() == [7, 2.5, 4.0, 9]

    rows = duckdb.sql(
        "SELECT union_tag(u) FROM (VALUES "
        "(union_value(int := 7::BIGINT)::UNION(int BIGINT, float DOUBLE)), "
        "(union_value(float := 2.5)::UNION(int BIGINT, float DOUBLE))) AS v(u)"
    ).fetchall()
    assert rows == [("int",), ("float",)]


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok", name)
