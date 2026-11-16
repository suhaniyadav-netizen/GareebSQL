import logging
from contextlib import contextmanager
import mysql.connector
from mysql.connector import pooling
from .config import Config

logger = logging.getLogger(__name__)

_pool = None

def get_connection_pool():
    global _pool
    if _pool is None:
        try:
            _pool = pooling.MySQLConnectionPool(
                pool_name="sppa_bank_pool",
                pool_size=10,
                pool_reset_session=True,
                host=Config.DB_HOST,
                port=Config.DB_PORT,
                user=Config.DB_USER,
                password=Config.DB_PASSWORD,
                database=Config.DB_NAME,
                autocommit=False
            )
            logger.info("MySQL connection pool initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize MySQL connection pool: {e}")
            raise
    return _pool

@contextmanager
def get_db():
    """
    Context manager yielding (connection, cursor).
    Provides automatic commit on success and rollback on exception.
    Always closes cursor and returns connection to pool.
    """
    pool = get_connection_pool()
    conn = pool.get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        yield conn, cursor
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Database error during transaction: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

def execute_query(query, params=None, fetchone=False, fetchall=True, commit=False):
    """
    Helper to execute a single query safely.
    """
    with get_db() as (conn, cursor):
        cursor.execute(query, params or ())
        if commit:
            conn.commit()
            return cursor.lastrowid or cursor.rowcount
        if fetchone:
            return cursor.fetchone()
        if fetchall:
            return cursor.fetchall()
        return None

def check_db_health():
    """
    Checks if database connection is active and responsive.
    """
    try:
        res = execute_query("SELECT 1 AS alive;", fetchone=True)
        return bool(res and res.get("alive") == 1)
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False
