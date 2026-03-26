from pydantic import BaseModel


class PlaidMappingOut(BaseModel):
    id: int
    custom_category_id: int
    plaid_category: str

    model_config = {"from_attributes": True}


class PlaidMappingUpsert(BaseModel):
    plaid_category: str
    custom_category_id: int
