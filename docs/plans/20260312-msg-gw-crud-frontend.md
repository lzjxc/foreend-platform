# msg-gw CRUD + 前端消息网关管理 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 给 msg-gw 后端添加 CNPG 数据库 + Provider/Channel CRUD API + 热加载，然后在前端平台增加消息网关管理页面。

**Architecture:** msg-gw 从纯 YAML 配置升级为 DB 持久化（CNPG PostgreSQL），启动时从 DB 加载 provider/channel，首次启动从 YAML seed。凭证通过 Infisical key 引用存 DB，运行时通过 config-service API 拉取实际值。CRUD 操作后自动热加载 provider 实例。前端通过 `/notification-api` 代理（已有）对接 msg-gw。

**Tech Stack:** FastAPI + SQLAlchemy asyncpg + Alembic (后端), React + TanStack Query + Tailwind (前端), CNPG + Infisical (基础设施)

**涉及项目:**
| 项目 | 目录 | 改动 |
|------|------|------|
| backend-msg-gw | `E:/projects/coding/python/backend-msg-gw/msg-gw` | DB、CRUD API、热加载 |
| foreend-platform | `E:/projects/coding/python/foreend-platform` | 前端页面 |
| k8s-argo | `E:/projects/coding/gitops/k8s-argo/infra/msg-gw` | CNPG Cluster、DATABASE_URL |

---

## Chunk 1: 后端基础设施 — 数据库 + 模型

### Task 1: 添加数据库依赖

**Files:**
- Modify: `E:/projects/coding/python/backend-msg-gw/msg-gw/pyproject.toml`

- [ ] **Step 1: 添加 SQLAlchemy + asyncpg + alembic 依赖**

在 `[tool.poetry.dependencies]` 添加:
```toml
sqlalchemy = {extras = ["asyncio"], version = "^2.0"}
asyncpg = "^0.29"
alembic = "^1.13"
```

- [ ] **Step 2: 安装依赖**

Run: `cd E:/projects/coding/python/backend-msg-gw/msg-gw && poetry install`
Expected: 依赖安装成功

- [ ] **Step 3: Commit**

```bash
cd E:/projects/coding/python/backend-msg-gw
git add msg-gw/pyproject.toml msg-gw/poetry.lock
git commit -m "feat: add SQLAlchemy + asyncpg + alembic dependencies"
```

### Task 2: 数据库配置 + 连接

**Files:**
- Modify: `E:/projects/coding/python/backend-msg-gw/msg-gw/app/config.py`
- Create: `E:/projects/coding/python/backend-msg-gw/msg-gw/app/database.py`

- [ ] **Step 1: 添加 DATABASE_URL 到 Settings**

在 `config.py` 的 `Settings` 类中添加:
```python
# 数据库 — CNPG 通过 secret 注入 uri（postgresql:// 格式），需转换为 asyncpg
DATABASE_URL: str = "postgresql+asyncpg://msg_gw:msg_gw@localhost:5432/msg_gw"

# Config Service（用于拉取 Infisical 凭证）
CONFIG_SERVICE_URL: str = "http://config-service.shared-services.svc.cluster.local:8000"
CONFIG_SERVICE_API_KEY: str = ""
INFISICAL_PROJECT_SLUG: str = "shared-services-r-kdk"

@property
def async_database_url(self) -> str:
    """将 CNPG 提供的 postgresql:// URI 转换为 asyncpg 格式"""
    url = self.DATABASE_URL
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url
```

**注意**: K8s 中 CNPG 自动生成的 secret `msg-gw-pg-app` 的 `uri` 字段格式为 `postgresql://user:pass@host/db`，需在代码中替换为 `postgresql+asyncpg://`。

- [ ] **Step 2: 创建 database.py**

```python
"""数据库连接管理"""
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.config import settings

engine = create_async_engine(settings.async_database_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    """FastAPI 依赖注入"""
    async with async_session() as session:
        yield session
```

- [ ] **Step 3: Commit**

```bash
git add msg-gw/app/config.py msg-gw/app/database.py
git commit -m "feat: add database configuration and async session"
```

### Task 3: ORM 模型

**Files:**
- Create: `E:/projects/coding/python/backend-msg-gw/msg-gw/app/models/provider.py`
- Create: `E:/projects/coding/python/backend-msg-gw/msg-gw/app/models/channel.py`
- Modify: `E:/projects/coding/python/backend-msg-gw/msg-gw/app/models/__init__.py`

- [ ] **Step 1: 创建 Base model**

在 `app/models/__init__.py`:
```python
"""ORM 模型"""
from sqlalchemy.orm import DeclarativeBase
import uuid
from sqlalchemy import Column, String, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    """通用时间戳"""
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
```

- [ ] **Step 2: 创建 Provider 模型**

在 `app/models/provider.py`:
```python
"""Provider ORM 模型"""
import uuid
from sqlalchemy import Column, String, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
from app.models import Base, TimestampMixin


class Provider(Base, TimestampMixin):
    __tablename__ = "providers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)
    type = Column(String(50), nullable=False)  # dingtalk_webhook, telegram, etc.
    config = Column(JSON, default=dict)  # 非敏感配置 (port, use_tls, from_name...)
    credential_keys = Column(JSON, default=dict)  # Infisical key 引用 {"webhook_url": "DINGTALK_XXX"}
    description = Column(Text, default="")
    enabled = Column(Boolean, default=True, nullable=False)

    # 关联
    channels = relationship("Channel", back_populates="provider", cascade="all, delete-orphan")
```

- [ ] **Step 3: 创建 Channel 模型**

在 `app/models/channel.py`:
```python
"""Channel ORM 模型"""
import uuid
from sqlalchemy import Column, String, Boolean, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
from app.models import Base, TimestampMixin


class Channel(Base, TimestampMixin):
    __tablename__ = "channels"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("providers.id"), nullable=False)
    description = Column(Text, default="")
    default_title_prefix = Column(String(200), default="")
    default_recipients = Column(JSON, default=list)  # list[str]
    enabled = Column(Boolean, default=True, nullable=False)

    # 关联
    provider = relationship("Provider", back_populates="channels")
```

- [ ] **Step 4: 更新 __init__.py 导出**

在 `app/models/__init__.py` 底部添加:
```python
from app.models.provider import Provider
from app.models.channel import Channel
```

- [ ] **Step 5: Commit**

```bash
git add msg-gw/app/models/
git commit -m "feat: add Provider and Channel ORM models"
```

### Task 4: Alembic 初始化 + 迁移

**Files:**
- Create: `E:/projects/coding/python/backend-msg-gw/msg-gw/alembic.ini`
- Create: `E:/projects/coding/python/backend-msg-gw/msg-gw/alembic/env.py`
- Create: `E:/projects/coding/python/backend-msg-gw/msg-gw/alembic/versions/` (auto-generated)

- [ ] **Step 1: 初始化 Alembic**

Run:
```bash
cd E:/projects/coding/python/backend-msg-gw/msg-gw
poetry run alembic init alembic
```

- [ ] **Step 2: 配置 alembic.ini**

修改 `alembic.ini` 中的 `sqlalchemy.url`:
```ini
sqlalchemy.url = postgresql+asyncpg://msg_gw:msg_gw@localhost:5432/msg_gw
```

- [ ] **Step 3: 修改 alembic/env.py 支持 async + 从 settings 读 URL**

替换 `alembic/env.py` 关键部分:
```python
import asyncio
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context
from app.config import settings
from app.models import Base
from app.models.provider import Provider  # noqa: F401
from app.models.channel import Channel    # noqa: F401

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def get_url():
    return settings.DATABASE_URL


def run_migrations_offline():
    url = get_url()
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations():
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_url()
    connectable = async_engine_from_config(
        configuration, prefix="sqlalchemy.", poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online():
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

- [ ] **Step 4: 生成初始迁移**

Run:
```bash
poetry run alembic revision --autogenerate -m "initial: providers and channels tables"
```
Expected: 在 `alembic/versions/` 生成迁移文件

- [ ] **Step 5: Commit**

```bash
git add msg-gw/alembic.ini msg-gw/alembic/
git commit -m "feat: initialize Alembic with providers and channels migration"
```

### Task 5: K8s CNPG Cluster

**Files:**
- Create: `E:/projects/coding/gitops/k8s-argo/infra/msg-gw/deps/cnpg-cluster.yaml`
- Modify: `E:/projects/coding/gitops/k8s-argo/infra/msg-gw/deps/deployment.yaml`
- Modify: `E:/projects/coding/gitops/k8s-argo/infra/msg-gw/deps/kustomization.yaml`

- [ ] **Step 1: 创建 CNPG Cluster**

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: msg-gw-pg
  namespace: shared-services
  annotations:
    argocd.argoproj.io/sync-wave: "2"
spec:
  instances: 1
  storage:
    size: 2Gi
    storageClass: longhorn
  postgresql:
    parameters:
      max_connections: "100"
      shared_buffers: "64MB"
  bootstrap:
    initdb:
      database: msg_gw
      owner: msg_gw
```

- [ ] **Step 2: 在 deployment.yaml 添加 DATABASE_URL + CONFIG_SERVICE 环境变量**

在 `env:` 部分最前面（日志级别之前）添加:
```yaml
# 数据库 — 使用 CNPG 自动生成的 secret，代码中转换 postgresql:// → postgresql+asyncpg://
- name: DATABASE_URL
  valueFrom:
    secretKeyRef:
      name: msg-gw-pg-app
      key: uri
# Config Service（用于拉取 Infisical 凭证）— API Key 通过 ExternalSecret 注入
- name: CONFIG_SERVICE_URL
  value: "http://config-service.shared-services.svc.cluster.local:8000"
- name: CONFIG_SERVICE_API_KEY
  valueFrom:
    secretKeyRef:
      name: notification-secrets
      key: CONFIG_SERVICE_API_KEY
      optional: true
- name: INFISICAL_PROJECT_SLUG
  value: "shared-services-r-kdk"
```

**注意**: 需要在 Infisical `shared-services-r-kdk` 项目中创建 `CONFIG_SERVICE_API_KEY` 密钥（值为 `VfSEn5dBWdl97BeLkDr2d0AZSqKV7QkOjqa3kjXqTWk`），并确保 `notification-externalsecret.yaml` 包含该 key 的映射。CNPG secret `msg-gw-pg-app` 由 CNPG Cluster 自动创建，`uri` 字段格式为 `postgresql://msg_gw:xxxx@msg-gw-pg-rw.shared-services.svc:5432/msg_gw`，代码通过 `settings.async_database_url` property 自动转换。

- [ ] **Step 3: 更新 deployment.yaml 资源限制**

SQLAlchemy + asyncpg 增加内存开销，将 limits.memory 从 256Mi 提升到 384Mi:
```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "50m"
  limits:
    memory: "384Mi"
    cpu: "200m"
```

- [ ] **Step 4: 更新 kustomization.yaml**

在 resources 列表中添加 `cnpg-cluster.yaml`

- [ ] **Step 4: Commit (k8s-argo repo)**

```bash
cd E:/projects/coding/gitops/k8s-argo
git add infra/msg-gw/deps/
git commit -m "feat: add CNPG cluster for msg-gw"
```

---

## Chunk 2: 后端 CRUD API + 凭证集成

### Task 6: Config Service 客户端

**Files:**
- Create: `E:/projects/coding/python/backend-msg-gw/msg-gw/app/services/config_service_client.py`

- [ ] **Step 1: 创建 config-service 客户端**

```python
"""Config Service 客户端 - 用于管理 Infisical 密钥"""
import logging
from typing import Optional
import httpx
from app.config import settings

logger = logging.getLogger(__name__)


class ConfigServiceClient:
    """通过 config-service API 管理 Infisical 密钥"""

    def __init__(self):
        self.base_url = settings.CONFIG_SERVICE_URL
        self.api_key = settings.CONFIG_SERVICE_API_KEY
        self.project_slug = settings.INFISICAL_PROJECT_SLUG

    @property
    def _headers(self) -> dict:
        return {"X-API-Key": self.api_key}

    async def get_secret(self, key: str) -> Optional[str]:
        """获取单个密钥值"""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    f"{self.base_url}/api/v1/secrets/{key}",
                    params={"project_slug": self.project_slug},
                    headers=self._headers,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("value")
                logger.warning(f"Failed to get secret {key}: {resp.status_code}")
                return None
        except Exception as e:
            logger.error(f"Error fetching secret {key}: {e}")
            return None

    async def get_secrets_batch(self, keys: list[str]) -> dict[str, str]:
        """批量获取密钥值（并发请求）"""
        import asyncio
        tasks = {key: self.get_secret(key) for key in keys}
        results = await asyncio.gather(*tasks.values(), return_exceptions=True)
        return {
            key: val for key, val in zip(tasks.keys(), results)
            if isinstance(val, str)
        }

    async def create_secret(self, key: str, value: str) -> bool:
        """创建密钥"""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    f"{self.base_url}/api/v1/secrets",
                    headers=self._headers,
                    json={
                        "project_slug": self.project_slug,
                        "key": key,
                        "value": value,
                    },
                )
                return resp.status_code in (200, 201)
        except Exception as e:
            logger.error(f"Error creating secret {key}: {e}")
            return False

    async def update_secret(self, key: str, value: str) -> bool:
        """更新密钥"""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.patch(
                    f"{self.base_url}/api/v1/secrets/{key}",
                    headers=self._headers,
                    json={
                        "project_slug": self.project_slug,
                        "value": value,
                    },
                )
                return resp.status_code == 200
        except Exception as e:
            logger.error(f"Error updating secret {key}: {e}")
            return False

    async def delete_secret(self, key: str) -> bool:
        """删除密钥"""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.delete(
                    f"{self.base_url}/api/v1/secrets/{key}",
                    params={"project_slug": self.project_slug},
                    headers=self._headers,
                )
                return resp.status_code in (200, 204)
        except Exception as e:
            logger.error(f"Error deleting secret {key}: {e}")
            return False


# 全局单例
config_service_client = ConfigServiceClient()
```

- [ ] **Step 2: Commit**

```bash
git add msg-gw/app/services/config_service_client.py
git commit -m "feat: add config-service client for Infisical integration"
```

### Task 7: CRUD Schemas

**Files:**
- Create: `E:/projects/coding/python/backend-msg-gw/msg-gw/app/schemas/provider.py`
- Create: `E:/projects/coding/python/backend-msg-gw/msg-gw/app/schemas/channel.py`

- [ ] **Step 1: 创建 Provider CRUD schemas**

```python
"""Provider API Schemas"""
from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field


# Provider 类型定义及其所需凭证字段
PROVIDER_TYPE_CREDENTIALS = {
    "dingtalk_webhook": ["webhook_url", "secret"],
    "dingtalk_stream": ["stream_pool_url", "app_name", "conversation_id"],
    "wecom_webhook": ["webhook_url"],
    "telegram": ["bot_token", "default_chat_id"],
    "whatsapp": ["account_sid", "auth_token", "from_number", "default_to_number"],
    "email_smtp": ["host", "username", "password", "from_address"],
}

# Provider 类型的非敏感配置字段
PROVIDER_TYPE_CONFIG = {
    "email_smtp": ["port", "from_name", "use_tls", "use_ssl"],
    "dingtalk_webhook": [],
    "dingtalk_stream": [],
    "wecom_webhook": [],
    "telegram": [],
    "whatsapp": [],
}


class ProviderCreate(BaseModel):
    """创建 Provider"""
    name: str = Field(..., min_length=1, max_length=100)
    type: str = Field(..., description="Provider 类型")
    config: dict = Field(default_factory=dict, description="非敏感配置")
    credential_keys: dict = Field(default_factory=dict, description="Infisical key 引用")
    credentials: Optional[dict] = Field(None, description="凭证值（会自动存入 Infisical）")
    description: str = ""
    enabled: bool = True


class ProviderUpdate(BaseModel):
    """更新 Provider"""
    config: Optional[dict] = None
    credential_keys: Optional[dict] = None
    credentials: Optional[dict] = None  # 新凭证值，会更新 Infisical
    description: Optional[str] = None
    enabled: Optional[bool] = None


class ProviderResponse(BaseModel):
    """Provider 响应"""
    id: UUID
    name: str
    type: str
    config: dict
    credential_keys: dict
    description: str
    enabled: bool
    channel_count: int = 0
    healthy: Optional[bool] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProviderListResponse(BaseModel):
    """Provider 列表响应"""
    success: bool
    data: list[ProviderResponse]


class ProviderDetailResponse(BaseModel):
    """Provider 详情响应"""
    success: bool
    data: ProviderResponse


class ProviderTypeInfo(BaseModel):
    """Provider 类型信息"""
    type: str
    credential_fields: list[str]
    config_fields: list[str]
```

- [ ] **Step 2: 创建 Channel CRUD schemas**

```python
"""Channel API Schemas"""
from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field


class ChannelCreate(BaseModel):
    """创建 Channel"""
    name: str = Field(..., min_length=1, max_length=100)
    provider_id: UUID
    description: str = ""
    default_title_prefix: str = ""
    default_recipients: list[str] = []
    enabled: bool = True


class ChannelUpdate(BaseModel):
    """更新 Channel"""
    provider_id: Optional[UUID] = None
    description: Optional[str] = None
    default_title_prefix: Optional[str] = None
    default_recipients: Optional[list[str]] = None
    enabled: Optional[bool] = None


class ChannelResponse(BaseModel):
    """Channel 响应"""
    id: UUID
    name: str
    provider_id: UUID
    provider_name: str
    provider_type: str
    description: str
    default_title_prefix: str
    default_recipients: list[str]
    enabled: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ChannelListResponse(BaseModel):
    """Channel 列表响应"""
    success: bool
    data: list[ChannelResponse]


class ChannelDetailResponse(BaseModel):
    """Channel 详情响应"""
    success: bool
    data: ChannelResponse


class ChannelTestRequest(BaseModel):
    """Channel 测试发送"""
    title: str = "测试消息"
    content: str = "这是一条来自消息网关管理页面的测试消息"
    content_type: str = "markdown"
```

- [ ] **Step 3: Commit**

```bash
git add msg-gw/app/schemas/provider.py msg-gw/app/schemas/channel.py
git commit -m "feat: add Provider and Channel CRUD schemas"
```

### Task 8: 重构 ChannelManager 支持 DB 加载 + 热加载

**Files:**
- Modify: `E:/projects/coding/python/backend-msg-gw/msg-gw/app/services/channel_manager.py`

- [ ] **Step 1: 重构 ChannelManager**

核心改动:
- 保留 `load_config()` 用于 seed
- 新增 `load_from_db()` 从数据库加载
- 新增 `reload()` 热加载（从 DB 重新加载 + 重新初始化 provider）
- 新增 `_resolve_credentials()` 通过 config-service 拉取凭证
- `_create_provider()` 改为接受 resolved 凭证 dict

关键方法签名:
```python
class ChannelManager:
    async def load_from_db(self, db: AsyncSession):
        """从 DB 加载所有 enabled 的 provider + channel，通过 config-service 解析凭证"""

    async def reload(self, db: AsyncSession):
        """热加载: 清空内存 → 从 DB 重新加载"""

    async def seed_from_yaml(self, db: AsyncSession, config_path: str | None = None):
        """首次启动时，将 YAML 配置 seed 到 DB"""

    async def _resolve_credentials(self, credential_keys: dict) -> dict:
        """通过 config-service 批量拉取 Infisical 凭证值"""

    def _create_provider_from_config(self, name: str, provider_type: str,
                                      config: dict, credentials: dict) -> BaseProvider | None:
        """根据类型 + 配置 + 凭证创建 Provider 实例"""
```

**Seed 凭证映射逻辑**（关键！）:

`seed_from_yaml()` 需要将 YAML 中的 `${VAR}` 引用转换为 DB 的 `credential_keys` 字段：

```python
async def seed_from_yaml(self, db: AsyncSession, config_path: str | None = None):
    """首次启动，YAML → DB seed"""
    # 检查 DB 是否已有数据
    result = await db.execute(select(func.count()).select_from(ProviderModel))
    if result.scalar() > 0:
        return  # 已有数据，跳过 seed

    # 解析 YAML
    config = yaml.safe_load(open(config_path))

    for name, prov_cfg in config.get("providers", {}).items():
        # 将 "${VAR}" 转换为 credential_keys
        credential_keys = {}
        non_sensitive_config = {}
        for key, value in prov_cfg.items():
            if key == "type":
                continue
            if isinstance(value, str) and value.startswith("${"):
                # "${DINGTALK_HOMEWORK_WEBHOOK}" → credential_keys["webhook_url"] = "DINGTALK_HOMEWORK_WEBHOOK"
                infisical_key = value[2:-1]
                credential_keys[key] = infisical_key
            else:
                non_sensitive_config[key] = value

        provider = ProviderModel(
            name=name, type=prov_cfg["type"],
            config=non_sensitive_config,
            credential_keys=credential_keys,
        )
        db.add(provider)

    await db.flush()  # 获取 provider IDs

    for name, ch_cfg in config.get("channels", {}).items():
        provider_ref = ch_cfg.get("provider_ref")
        # 查找 provider ID by name
        prov = await db.execute(select(ProviderModel).where(ProviderModel.name == provider_ref))
        prov_obj = prov.scalar()
        if prov_obj:
            channel = ChannelModel(
                name=name, provider_id=prov_obj.id,
                description=ch_cfg.get("description", ""),
                default_title_prefix=ch_cfg.get("default_title_prefix", ""),
                default_recipients=ch_cfg.get("default_recipients", []),
            )
            db.add(channel)

    await db.commit()
```

注意事项:
- `load_config()` (YAML) 保留但改为调用 `seed_from_yaml()` 内部使用
- 既有的 `_expand_env()` 保留用于运行时从环境变量解析凭证（seed 的 provider 凭证仍通过 env var 注入 Pod）
- `list_channels()` 和 `health_check()` 接口不变，保持向后兼容
- **Breaking change**: `GET /api/v1/channels` 响应格式增加了字段（provider_id, provider_name, enabled 等），但原有 `name`, `provider`, `description` 字段保留，现有消费者不会 break

- [ ] **Step 2: Commit**

```bash
git add msg-gw/app/services/channel_manager.py
git commit -m "refactor: ChannelManager supports DB loading and hot reload"
```

### Task 9: Provider CRUD Router

**Files:**
- Create: `E:/projects/coding/python/backend-msg-gw/msg-gw/app/routers/providers.py`

- [ ] **Step 1: 创建 Provider CRUD 路由**

```python
"""Provider 管理路由"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.provider import Provider
from app.models.channel import Channel
from app.schemas.provider import (
    ProviderCreate, ProviderUpdate, ProviderResponse,
    ProviderListResponse, ProviderDetailResponse,
    PROVIDER_TYPE_CREDENTIALS, PROVIDER_TYPE_CONFIG, ProviderTypeInfo,
)
from app.services.channel_manager import channel_manager
from app.services.config_service_client import config_service_client

router = APIRouter(prefix="/providers", tags=["providers"])


@router.get("", response_model=ProviderListResponse)
async def list_providers(db: AsyncSession = Depends(get_db)):
    """列出所有 Provider"""
    stmt = select(Provider).order_by(Provider.created_at)
    result = await db.execute(stmt)
    providers = result.scalars().all()

    data = []
    for p in providers:
        # 获取关联 channel 数
        count_stmt = select(func.count()).where(Channel.provider_id == p.id)
        count_result = await db.execute(count_stmt)
        channel_count = count_result.scalar() or 0

        # 检查健康状态
        runtime_provider = channel_manager.get_provider(p.name)
        healthy = None
        if runtime_provider:
            try:
                healthy = await runtime_provider.health_check()
            except Exception:
                healthy = False

        data.append(ProviderResponse(
            id=p.id, name=p.name, type=p.type,
            config=p.config or {}, credential_keys=p.credential_keys or {},
            description=p.description or "", enabled=p.enabled,
            channel_count=channel_count, healthy=healthy,
            created_at=p.created_at, updated_at=p.updated_at,
        ))

    return ProviderListResponse(success=True, data=data)


@router.get("/types")
async def list_provider_types():
    """列出所有支持的 Provider 类型及其配置字段"""
    types = []
    for ptype, cred_fields in PROVIDER_TYPE_CREDENTIALS.items():
        config_fields = PROVIDER_TYPE_CONFIG.get(ptype, [])
        types.append(ProviderTypeInfo(
            type=ptype, credential_fields=cred_fields, config_fields=config_fields,
        ))
    return {"success": True, "data": types}


@router.post("", response_model=ProviderDetailResponse)
async def create_provider(body: ProviderCreate, db: AsyncSession = Depends(get_db)):
    """创建 Provider（凭证自动存入 Infisical）"""
    # 检查名称唯一
    existing = await db.execute(select(Provider).where(Provider.name == body.name))
    if existing.scalar():
        raise HTTPException(400, f"Provider '{body.name}' already exists")

    # 检查类型合法
    if body.type not in PROVIDER_TYPE_CREDENTIALS:
        raise HTTPException(400, f"Unknown provider type: {body.type}")

    credential_keys = dict(body.credential_keys)

    # 如果提供了 credentials 值，存入 Infisical
    if body.credentials:
        for field, value in body.credentials.items():
            key = f"MSG_GW_{body.name.upper()}_{field.upper()}"
            success = await config_service_client.create_secret(key, value)
            if not success:
                raise HTTPException(500, f"Failed to store credential: {field}")
            credential_keys[field] = key

    provider = Provider(
        name=body.name, type=body.type,
        config=body.config, credential_keys=credential_keys,
        description=body.description, enabled=body.enabled,
    )
    db.add(provider)
    await db.commit()
    await db.refresh(provider)

    # 热加载
    await channel_manager.reload(db)

    return ProviderDetailResponse(success=True, data=ProviderResponse(
        id=provider.id, name=provider.name, type=provider.type,
        config=provider.config or {}, credential_keys=provider.credential_keys or {},
        description=provider.description or "", enabled=provider.enabled,
        channel_count=0, created_at=provider.created_at, updated_at=provider.updated_at,
    ))


@router.get("/{provider_id}", response_model=ProviderDetailResponse)
async def get_provider(provider_id: UUID, db: AsyncSession = Depends(get_db)):
    """获取 Provider 详情"""
    provider = await db.get(Provider, provider_id)
    if not provider:
        raise HTTPException(404, "Provider not found")

    count_stmt = select(func.count()).where(Channel.provider_id == provider.id)
    count_result = await db.execute(count_stmt)
    channel_count = count_result.scalar() or 0

    return ProviderDetailResponse(success=True, data=ProviderResponse(
        id=provider.id, name=provider.name, type=provider.type,
        config=provider.config or {}, credential_keys=provider.credential_keys or {},
        description=provider.description or "", enabled=provider.enabled,
        channel_count=channel_count,
        created_at=provider.created_at, updated_at=provider.updated_at,
    ))


@router.put("/{provider_id}", response_model=ProviderDetailResponse)
async def update_provider(provider_id: UUID, body: ProviderUpdate, db: AsyncSession = Depends(get_db)):
    """更新 Provider"""
    provider = await db.get(Provider, provider_id)
    if not provider:
        raise HTTPException(404, "Provider not found")

    if body.config is not None:
        provider.config = body.config
    if body.credential_keys is not None:
        provider.credential_keys = body.credential_keys
    if body.description is not None:
        provider.description = body.description
    if body.enabled is not None:
        provider.enabled = body.enabled

    # 如果提供了新凭证值，更新 Infisical
    if body.credentials:
        cred_keys = dict(provider.credential_keys or {})
        for field, value in body.credentials.items():
            key = cred_keys.get(field) or f"MSG_GW_{provider.name.upper()}_{field.upper()}"
            if key in (provider.credential_keys or {}).values():
                await config_service_client.update_secret(key, value)
            else:
                await config_service_client.create_secret(key, value)
            cred_keys[field] = key
        provider.credential_keys = cred_keys

    await db.commit()
    await db.refresh(provider)

    # 热加载
    await channel_manager.reload(db)

    count_stmt = select(func.count()).where(Channel.provider_id == provider.id)
    count_result = await db.execute(count_stmt)
    channel_count = count_result.scalar() or 0

    return ProviderDetailResponse(success=True, data=ProviderResponse(
        id=provider.id, name=provider.name, type=provider.type,
        config=provider.config or {}, credential_keys=provider.credential_keys or {},
        description=provider.description or "", enabled=provider.enabled,
        channel_count=channel_count,
        created_at=provider.created_at, updated_at=provider.updated_at,
    ))


@router.delete("/{provider_id}")
async def delete_provider(provider_id: UUID, db: AsyncSession = Depends(get_db)):
    """删除 Provider（需无 Channel 引用）"""
    provider = await db.get(Provider, provider_id)
    if not provider:
        raise HTTPException(404, "Provider not found")

    count_stmt = select(func.count()).where(Channel.provider_id == provider.id)
    count_result = await db.execute(count_stmt)
    if count_result.scalar() > 0:
        raise HTTPException(400, "Cannot delete: provider has associated channels")

    await db.delete(provider)
    await db.commit()

    # 热加载
    await channel_manager.reload(db)

    return {"success": True, "message": f"Provider '{provider.name}' deleted"}


@router.get("/{provider_id}/health")
async def check_provider_health(provider_id: UUID, db: AsyncSession = Depends(get_db)):
    """检查单个 Provider 健康状态"""
    provider = await db.get(Provider, provider_id)
    if not provider:
        raise HTTPException(404, "Provider not found")

    runtime_provider = channel_manager.get_provider(provider.name)
    if not runtime_provider:
        return {"success": True, "healthy": False, "reason": "Provider not loaded in runtime"}

    try:
        healthy = await runtime_provider.health_check()
        return {"success": True, "healthy": healthy}
    except Exception as e:
        return {"success": True, "healthy": False, "reason": str(e)}
```

- [ ] **Step 2: Commit**

```bash
git add msg-gw/app/routers/providers.py
git commit -m "feat: add Provider CRUD API router"
```

### Task 10: Channel CRUD Router (增强)

**Files:**
- Modify: `E:/projects/coding/python/backend-msg-gw/msg-gw/app/routers/channels.py`

- [ ] **Step 1: 重写 channels.py 添加 CRUD**

保留原有 `GET /channels` 接口（增强），新增 POST/PUT/DELETE + test。

关键端点:
```
GET    /channels          — 列出所有 channel（从 DB，含 provider 信息）
POST   /channels          — 创建 channel
GET    /channels/{name}   — 获取 channel 详情
PUT    /channels/{name}   — 更新 channel
DELETE /channels/{name}   — 删除 channel
POST   /channels/{name}/test — 测试发送
```

测试发送使用现有的 `sender.send()` 方法。

- [ ] **Step 2: Commit**

```bash
git add msg-gw/app/routers/channels.py
git commit -m "feat: enhance Channel router with CRUD + test send"
```

### Task 11: Admin 路由 + 启动集成

**Files:**
- Create: `E:/projects/coding/python/backend-msg-gw/msg-gw/app/routers/admin.py`
- Modify: `E:/projects/coding/python/backend-msg-gw/msg-gw/app/main.py`

- [ ] **Step 1: 创建 admin 路由**

```python
"""管理路由"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.channel_manager import channel_manager

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/reload")
async def reload_channels(db: AsyncSession = Depends(get_db)):
    """热加载：从 DB 重新加载所有 Provider 和 Channel"""
    await channel_manager.reload(db)
    return {
        "success": True,
        "providers_loaded": len(channel_manager.providers),
        "channels_loaded": len(channel_manager.channels),
    }
```

- [ ] **Step 2: 修改 main.py lifespan**

启动时:
1. 使用 SQLAlchemy `create_all` 确保表存在（不用 Alembic runtime，避免 async 驱动冲突）
2. 检查 DB 是否为空，为空则 seed from YAML
3. 从 DB 加载 provider/channel
4. 然后启动 stream_pool、telegram_poller 等

**注意**: Alembic 仅用于本地开发和手动迁移（`poetry run alembic upgrade head`），不在 lifespan 中自动执行。原因：Alembic `command.upgrade()` 是同步调用，与 asyncpg 不兼容会导致启动崩溃。生产环境使用 `create_all` 确保表存在。

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. 确保表存在（使用 create_all，不用 Alembic）
    from app.models import Base
    from app.database import engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 2. 从 DB 加载（首次启动自动 seed）
    async with async_session() as db:
        await channel_manager.seed_from_yaml(db)  # 仅在 DB 为空时 seed
        await channel_manager.load_from_db(db)

    # 3. 启动其他服务（stream_pool, telegram, imap）...
    # (保持原有逻辑)
```

注册新路由:
```python
from app.routers import notify, channels, webhooks, cards, providers, admin

app.include_router(providers.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
```

- [ ] **Step 3: Commit**

```bash
git add msg-gw/app/routers/admin.py msg-gw/app/main.py
git commit -m "feat: add admin reload route and DB-based startup"
```

### Task 12: 更新 Dockerfile

**Files:**
- Modify: `E:/projects/coding/python/backend-msg-gw/msg-gw/Dockerfile`

- [ ] **Step 1: 在 COPY 部分添加 alembic 文件**

```dockerfile
# 复制应用代码
COPY app ./app
COPY config ./config
COPY alembic ./alembic
COPY alembic.ini ./
```

- [ ] **Step 2: Commit**

```bash
git add msg-gw/Dockerfile
git commit -m "feat: include alembic in Docker image"
```

### Task 13: 后端集成测试

**Files:**
- Create: `E:/projects/coding/python/backend-msg-gw/tests/test_provider_crud.py`
- Create: `E:/projects/coding/python/backend-msg-gw/tests/test_channel_crud.py`

- [ ] **Step 1: 编写 Provider CRUD 测试**

测试覆盖:
- 创建 provider（含类型校验）
- 列出 providers
- 获取 provider 详情
- 更新 provider
- 删除 provider（无 channel 引用时成功，有引用时 400）
- provider types 列表

- [ ] **Step 2: 编写 Channel CRUD 测试**

测试覆盖:
- 创建 channel（关联 provider）
- 列出 channels
- 获取 channel 详情
- 更新 channel
- 删除 channel

- [ ] **Step 3: 运行测试**

Run: `cd E:/projects/coding/python/backend-msg-gw && poetry run pytest tests/ -v`
Expected: 全部通过

- [ ] **Step 4: Commit**

```bash
git add tests/
git commit -m "test: add Provider and Channel CRUD tests"
```

---

## Chunk 3: 后端构建部署

### Task 14: 构建 + 部署 msg-gw

- [ ] **Step 1: 本地测试通过**

```bash
cd E:/projects/coding/python/backend-msg-gw/msg-gw
poetry run pytest ../tests/ -v
```

- [ ] **Step 2: 构建镜像**

```bash
cd E:/projects/coding/python/backend-msg-gw/msg-gw
docker build -t lzjxccode/msg-gw:v7 .
docker push lzjxccode/msg-gw:v7
```

- [ ] **Step 3: 部署 CNPG Cluster**

```bash
kubectl apply -f E:/projects/coding/gitops/k8s-argo/infra/msg-gw/deps/cnpg-cluster.yaml
kubectl wait --for=condition=Ready cluster/msg-gw-pg -n shared-services --timeout=120s
```

- [ ] **Step 4: 更新 deployment image tag 为 v7，apply 部署**

```bash
kubectl apply -k E:/projects/coding/gitops/k8s-argo/infra/msg-gw/deps/
kubectl rollout status deployment/msg-gw -n shared-services --timeout=120s
```

- [ ] **Step 5: 验证新 API**

```bash
# 健康检查
curl -s http://192.168.1.191:31229/health | python -m json.tool

# Provider 列表（应包含 seed 数据）
curl -s http://192.168.1.191:31229/api/v1/providers | python -m json.tool

# Channel 列表
curl -s http://192.168.1.191:31229/api/v1/channels | python -m json.tool

# Provider 类型
curl -s http://192.168.1.191:31229/api/v1/providers/types | python -m json.tool
```

- [ ] **Step 6: Commit 所有项目改动**

```bash
# msg-gw
cd E:/projects/coding/python/backend-msg-gw
git add -A && git push

# k8s-argo
cd E:/projects/coding/gitops/k8s-argo
git add infra/msg-gw/ && git commit -m "feat: add CNPG + DB env for msg-gw" && git push
```

---

## Chunk 4: 前端 — 类型 + API + Hooks

### Task 15: 前端类型定义

**Files:**
- Create: `E:/projects/coding/python/foreend-platform/src/types/msg-gw.ts`

- [ ] **Step 1: 创建类型定义**

```typescript
// Provider 类型
export interface MsgGwProvider {
  id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  credential_keys: Record<string, string>;
  description: string;
  enabled: boolean;
  channel_count: number;
  healthy?: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProviderInput {
  name: string;
  type: string;
  config?: Record<string, unknown>;
  credential_keys?: Record<string, string>;
  credentials?: Record<string, string>;
  description?: string;
  enabled?: boolean;
}

export interface UpdateProviderInput {
  config?: Record<string, unknown>;
  credential_keys?: Record<string, string>;
  credentials?: Record<string, string>;
  description?: string;
  enabled?: boolean;
}

// Channel 类型
export interface MsgGwChannel {
  id: string;
  name: string;
  provider_id: string;
  provider_name: string;
  provider_type: string;
  description: string;
  default_title_prefix: string;
  default_recipients: string[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateChannelInput {
  name: string;
  provider_id: string;
  description?: string;
  default_title_prefix?: string;
  default_recipients?: string[];
  enabled?: boolean;
}

export interface UpdateChannelInput {
  provider_id?: string;
  description?: string;
  default_title_prefix?: string;
  default_recipients?: string[];
  enabled?: boolean;
}

export interface ChannelTestInput {
  title?: string;
  content?: string;
  content_type?: string;
}

// Provider 类型元信息
export interface ProviderTypeInfo {
  type: string;
  credential_fields: string[];
  config_fields: string[];
}

// Health
export interface MsgGwHealth {
  status: string;
  channels_loaded: number;
  providers: Record<string, boolean>;
  telegram_polling: boolean;
}
```

- [ ] **Step 2: Commit**

```bash
cd E:/projects/coding/python/foreend-platform
git add src/types/msg-gw.ts
git commit -m "feat: add msg-gw TypeScript types"
```

### Task 16: API 客户端

**Files:**
- Modify: `E:/projects/coding/python/foreend-platform/src/api/client.ts`
- Create: `E:/projects/coding/python/foreend-platform/src/api/msg-gw.ts`

- [ ] **Step 1: 在 client.ts 添加 msgGwClient**

```typescript
// Message Gateway API client - use proxy
const MSG_GW_URL = '/notification-api';  // Both dev (Vite) and prod (nginx)
export const msgGwClient = createApiClient(MSG_GW_URL);
```

- [ ] **Step 2: 创建 msg-gw API 函数**

```typescript
import { msgGwClient } from './client';
import type {
  MsgGwProvider, CreateProviderInput, UpdateProviderInput,
  MsgGwChannel, CreateChannelInput, UpdateChannelInput,
  ChannelTestInput, ProviderTypeInfo, MsgGwHealth,
} from '@/types/msg-gw';

// Provider API
export const providerApi = {
  list: () => msgGwClient.get<{ success: boolean; data: MsgGwProvider[] }>('/api/v1/providers'),
  get: (id: string) => msgGwClient.get<{ success: boolean; data: MsgGwProvider }>(`/api/v1/providers/${id}`),
  create: (data: CreateProviderInput) => msgGwClient.post<{ success: boolean; data: MsgGwProvider }>('/api/v1/providers', data),
  update: (id: string, data: UpdateProviderInput) => msgGwClient.put<{ success: boolean; data: MsgGwProvider }>(`/api/v1/providers/${id}`, data),
  delete: (id: string) => msgGwClient.delete(`/api/v1/providers/${id}`),
  health: (id: string) => msgGwClient.get<{ success: boolean; healthy: boolean }>(`/api/v1/providers/${id}/health`),
  types: () => msgGwClient.get<{ success: boolean; data: ProviderTypeInfo[] }>('/api/v1/providers/types'),
};

// Channel API
export const channelApi = {
  list: () => msgGwClient.get<{ success: boolean; data: MsgGwChannel[] }>('/api/v1/channels'),
  get: (name: string) => msgGwClient.get<{ success: boolean; data: MsgGwChannel }>(`/api/v1/channels/${name}`),
  create: (data: CreateChannelInput) => msgGwClient.post<{ success: boolean; data: MsgGwChannel }>('/api/v1/channels', data),
  update: (name: string, data: UpdateChannelInput) => msgGwClient.put<{ success: boolean; data: MsgGwChannel }>(`/api/v1/channels/${name}`, data),
  delete: (name: string) => msgGwClient.delete(`/api/v1/channels/${name}`),
  test: (name: string, data?: ChannelTestInput) => msgGwClient.post(`/api/v1/channels/${name}/test`, data || {}),
};

// Admin API
export const msgGwAdminApi = {
  reload: () => msgGwClient.post('/api/v1/admin/reload'),
  health: () => msgGwClient.get<MsgGwHealth>('/health'),
};
```

- [ ] **Step 3: Commit**

```bash
git add src/api/client.ts src/api/msg-gw.ts
git commit -m "feat: add msg-gw API client"
```

### Task 17: React Query Hooks

**Files:**
- Create: `E:/projects/coding/python/foreend-platform/src/hooks/use-msg-gw.ts`

- [ ] **Step 1: 创建 hooks**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { providerApi, channelApi, msgGwAdminApi } from '@/api/msg-gw';

export const msgGwKeys = {
  all: ['msg-gw'] as const,
  providers: () => [...msgGwKeys.all, 'providers'] as const,
  providerTypes: () => [...msgGwKeys.all, 'provider-types'] as const,
  channels: () => [...msgGwKeys.all, 'channels'] as const,
  health: () => [...msgGwKeys.all, 'health'] as const,
};

// Provider hooks
export function useProviders() {
  return useQuery({
    queryKey: msgGwKeys.providers(),
    queryFn: async () => { const { data } = await providerApi.list(); return data.data; },
  });
}

export function useProviderTypes() {
  return useQuery({
    queryKey: msgGwKeys.providerTypes(),
    queryFn: async () => { const { data } = await providerApi.types(); return data.data; },
  });
}

export function useCreateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Parameters<typeof providerApi.create>[0]) => {
      const { data } = await providerApi.create(input);
      return data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: msgGwKeys.providers() }); },
  });
}

export function useUpdateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Parameters<typeof providerApi.update>[1]) => {
      const { data } = await providerApi.update(id, input);
      return data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: msgGwKeys.providers() }); },
  });
}

export function useDeleteProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => providerApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: msgGwKeys.providers() }); },
  });
}

// Channel hooks
export function useChannels() {
  return useQuery({
    queryKey: msgGwKeys.channels(),
    queryFn: async () => { const { data } = await channelApi.list(); return data.data; },
  });
}

export function useCreateChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Parameters<typeof channelApi.create>[0]) => {
      const { data } = await channelApi.create(input);
      return data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: msgGwKeys.channels() }); },
  });
}

export function useUpdateChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, ...input }: { name: string } & Parameters<typeof channelApi.update>[1]) => {
      const { data } = await channelApi.update(name, input);
      return data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: msgGwKeys.channels() }); },
  });
}

export function useDeleteChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => channelApi.delete(name),
    onSuccess: () => { qc.invalidateQueries({ queryKey: msgGwKeys.channels() }); },
  });
}

export function useTestChannel() {
  return useMutation({
    mutationFn: ({ name, ...input }: { name: string } & Parameters<typeof channelApi.test>[1]) =>
      channelApi.test(name, input),
  });
}

// Health + Admin
export function useMsgGwHealth() {
  return useQuery({
    queryKey: msgGwKeys.health(),
    queryFn: async () => { const { data } = await msgGwAdminApi.health(); return data; },
    refetchInterval: 30000,
  });
}

export function useReloadMsgGw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => msgGwAdminApi.reload(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: msgGwKeys.all });
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-msg-gw.ts
git commit -m "feat: add msg-gw React Query hooks"
```

---

## Chunk 5: 前端页面

### Task 18: 消息网关页面

**Files:**
- Create: `E:/projects/coding/python/foreend-platform/src/pages/msg-gateway.tsx`

- [ ] **Step 1: 创建页面**

页面结构:
- 顶部: 标题 + 健康状态指示 + 热加载按钮
- 两个 tab: 「渠道管理」和「Provider 管理」
- **渠道管理 tab**: 卡片列表，每张卡片显示 channel 名、provider 类型 badge、描述、启用状态开关、测试发送按钮、编辑/删除按钮。右上角创建按钮。
- **Provider 管理 tab**: 卡片列表，每张卡片显示 provider 名、类型、健康状态灯、关联 channel 数、启用状态。右上角创建按钮。
- 创建/编辑使用 Dialog（modal）

使用现有 UI 组件: `Button, Card, Badge, Tabs, Dialog, Input, Select` from `@/components/ui/`

关键交互:
- 创建 provider dialog: 选择类型后动态显示该类型所需的凭证字段
- 测试发送: 点击后弹出小 dialog 输入标题和内容，发送后显示 toast 结果
- 启用/禁用: 直接 toggle，调用 update API

- [ ] **Step 2: Commit**

```bash
git add src/pages/msg-gateway.tsx
git commit -m "feat: add message gateway management page"
```

### Task 19: 侧边栏 + 路由

**Files:**
- Modify: `E:/projects/coding/python/foreend-platform/src/components/layout/sidebar.tsx`
- Modify: `E:/projects/coding/python/foreend-platform/src/App.tsx`

- [ ] **Step 1: 添加侧边栏导航项**

在 `sidebar.tsx` 的 `navItems` 中，在 `系统看板` 后面添加:
```typescript
{ path: '/msg-gateway', icon: MessageSquare, label: '消息网关' },
```

并导入 `MessageSquare` from `lucide-react`。

- [ ] **Step 2: 添加路由**

在 `App.tsx` 添加:
```typescript
import MsgGateway from '@/pages/msg-gateway';
// ...
<Route path="msg-gateway" element={<MsgGateway />} />
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/sidebar.tsx src/App.tsx
git commit -m "feat: add message gateway to sidebar and routes"
```

### Task 20: 更新 vite dev proxy port (如需要)

**Files:**
- Modify: `E:/projects/coding/python/foreend-platform/vite.config.js` (可能需要)

- [ ] **Step 1: 更新 vite proxy 的 notification-api port**

当前 vite.config.js 中 notification-api 指向 `http://192.168.1.191:31417`（旧端口），
实际 msg-gw-ts NodePort 是 `31229`。必须更新:

```javascript
'/notification-api': {
    target: 'http://192.168.1.191:31229',
    changeOrigin: true,
    rewrite: function (p) { return p.replace(/^\/notification-api/, ''); },
},
```

- [ ] **Step 2: Commit (if changed)**

```bash
git add vite.config.js
git commit -m "fix: update notification-api proxy port"
```

---

## Chunk 6: 前端构建部署 + 验证

### Task 21: 本地验证

- [ ] **Step 1: 启动开发服务器**

```bash
cd E:/projects/coding/python/foreend-platform
npm run dev
```

- [ ] **Step 2: 浏览器验证 localhost**

验证项:
- 侧边栏显示「消息网关」导航项
- 点击进入页面，两个 tab 正常显示
- 渠道列表加载正常（显示 8 个 seed 渠道）
- Provider 列表加载正常（显示 seed providers）
- 健康状态显示正常
- 创建/编辑 dialog 可正常打开
- 测试发送功能正常
- Console 无报错

### Task 22: 构建部署前端

- [ ] **Step 1: 构建镜像**

查看当前 image tag:
```bash
kubectl get deployment foreend-platform -n apps -o jsonpath='{.spec.template.spec.containers[0].image}'
```

构建新版本 (tag +1):
```bash
cd E:/projects/coding/python/foreend-platform
docker build --no-cache -t lzjxccode/personal-info-frontend:<new-tag> .
docker push lzjxccode/personal-info-frontend:<new-tag>
```

- [ ] **Step 2: 部署**

```bash
kubectl set image deployment/foreend-platform personal-info-frontend=lzjxccode/personal-info-frontend:<new-tag> -n apps
kubectl rollout status deployment/foreend-platform -n apps --timeout=120s
```

- [ ] **Step 3: 线上浏览器验证**

访问 `http://192.168.1.191:31765` 验证:
- 消息网关页面正常加载
- 数据从后端正确获取
- CRUD 操作正常
- 与本地验证结果一致

### Task 23: 更新文档 + Commit

- [ ] **Step 1: 更新 foreend-platform CLAUDE.md**

在模块速览表中添加消息网关:
```markdown
| 消息网关 | `/msg-gateway` | 渠道/Provider 管理、测试发送、健康监控 |
```

- [ ] **Step 2: Commit + Push 所有项目**

```bash
# foreend-platform
cd E:/projects/coding/python/foreend-platform
git add -A && git commit -m "feat: add message gateway management module" && git push

# backend-msg-gw (确认所有改动已 push)
cd E:/projects/coding/python/backend-msg-gw
git status && git push

# k8s-argo
cd E:/projects/coding/gitops/k8s-argo
git status && git push
```
