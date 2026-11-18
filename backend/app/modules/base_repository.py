from typing import Optional
from bson import ObjectId
from app.core.database import get_database


class BaseRepository:
    def __init__(self, collection_name: str):
        self.collection_name = collection_name

    def _collection(self):
        return get_database()[self.collection_name]

    def _serialize(self, doc: dict) -> dict:
        if doc and "_id" in doc:
            doc["id"] = str(doc.pop("_id"))
        return doc

    async def find_one(self, filter: dict) -> Optional[dict]:
        doc = await self._collection().find_one(filter)
        return self._serialize(doc) if doc else None

    async def find_many(
        self,
        filter: dict,
        skip: int = 0,
        limit: int = 100,
        sort: Optional[list] = None,
    ) -> list[dict]:
        cursor = self._collection().find(filter)
        if sort:
            cursor = cursor.sort(sort)
        cursor = cursor.skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        return [self._serialize(doc) for doc in docs]

    async def insert_one(self, document: dict) -> str:
        result = await self._collection().insert_one(document)
        return str(result.inserted_id)

    async def update_one(self, filter: dict, update: dict) -> bool:
        result = await self._collection().update_one(filter, {"$set": update})
        return result.modified_count > 0

    async def delete_one(self, filter: dict) -> bool:
        result = await self._collection().delete_one(filter)
        return result.deleted_count > 0

    async def count(self, filter: dict) -> int:
        return await self._collection().count_documents(filter)

    def _object_id_filter(self, doc_id: str) -> dict:
        try:
            return {"_id": ObjectId(doc_id)}
        except Exception:
            return {"_id": doc_id}
